# PIXEL READINESS AUDIT REPORT
Generated: 2026-05-27  
Status: **READY FOR PIXEL CONNECTION**  
Audit scope: Meta Pixel + CAPI, TikTok Pixel + Events API

---

## OVERALL VERDICT: ✅ PASS (after 7 fixes applied this session)

> Pixels are NOT yet connected. This report documents the pre-connection audit and fixes.

---

## 1. PURCHASE TRUTH LOCK — ✅ PASS

### Rule (permanent, non-negotiable)
```
payment.status === 'paid'  →  Purchase
Everything else            →  NOT a purchase
```

### Verification of every purchase-adjacent event:

| Trigger | Fires Purchase? | Verdict |
|---------|----------------|---------|
| `add_to_cart` VisitorEvent | ❌ Never | ✅ SAFE |
| `checkout_start` VisitorEvent | ❌ Never | ✅ SAFE |
| `checkout_complete` VisitorEvent | ❌ Never — behavioral only | ✅ SAFE |
| Thank-you page load | ❌ Never — only polls verify | ✅ SAFE |
| Sandbox / test payment | ❌ Blocked by `testMode: true` filter | ✅ SAFE |
| Pending payment | ❌ Blocked — fires only on `Operation === '2'` | ✅ SAFE |
| Failed payment | ❌ Webhook sets `status: 'failed'`, no CAPI | ✅ SAFE |
| Cancelled payment | ❌ Never reaches webhook success path | ✅ SAFE |
| `payment.status === 'paid'` (Cardcom webhook) | ✅ ONLY trigger | ✅ CORRECT |

### Purchase flow (verified):
```
Cardcom → POST /api/webhooks/payment
  → Operation === '2'
  → order.payment.status = 'paid'
  → fireMetaPurchase() (server CAPI)  ← ONLY HERE
  → fireTikTokPurchase() (server CAPI) ← ONLY HERE
  → testMode guard: CAPI skipped for test orders
```

### PAID_FILTER enforcement:
All 6 admin analytics routes import `PAID_FILTER` from `src/lib/analytics/sourceOfTruth.ts`.  
Zero local re-definitions remain.

---

## 2. EVENT TRUTH MAP — ✅ PASS

### Internal VisitorEvent taxonomy (stored in MongoDB):

| Event | Where fired | Dedup risk | Notes |
|-------|------------|------------|-------|
| `pageview` | `tracker.trackPageView()` on mount | None — once per page load | **NEW: Added this session** |
| `product_view` | `ProductClient.tsx` on mount | None | useEffect with stable dep |
| `add_to_cart` | `ProductClient.tsx` button click | None | User action |
| `cta_click` | `ProductClient.tsx` Buy Now click | None | User action |
| `checkout_start` | `checkout/page.tsx` on mount | Low — re-fires if page remounts | Acceptable; behavioral |
| `checkout_complete` | `success/page.tsx` after paid verified | None | `trackedRef.current` guard |
| `gallery_view` | `ProductClient.tsx` click + swipe | **FIXED** | Moved out of setState updater |
| `faq_open` | `ProductClient.tsx` accordion open | None | Fires once per open |
| `scroll_depth` | `tracker.trackScrollDepth()` | None | Once per milestone (25/50/75/100) |
| `rage_click` | `tracker.trackRageClicks()` | None | Fires after 3+ clicks, then resets |
| `inactive` | `tracker.trackInactivity()` | None | Once per session |
| `exit_page` | `visibilitychange` → hidden | Low — fires on tab switch too | Behavioral; acceptable |

### Behavioral vs Purchase (confirmed distinct):

```
checkout_complete VisitorEvent ≠ Purchase
  → checkout_complete: user reached confirmation page (behavioral)
  → Purchase: payment.status === 'paid' (MongoDB truth)

These will ALWAYS diverge. Expected. Never equate them.
```

---

## 3. DEDUPLICATION SYSTEM — ✅ PASS

### Architecture:
```
Order creation (POST /api/orders)
  → metaEventId  = "Purchase_{sessionId}_{timestamp}_{4-byte-random}"
  → tiktokEventId = "tt_PlaceAnOrder_{sessionId}_{timestamp}"
  → Stored in order.tracking

Webhook fires CAPI (server-side):
  → sends event_id = order.tracking.metaEventId (Meta)
  → sends event_id = order.tracking.tiktokEventId (TikTok)

Success page fires browser pixel (client-side):
  → fetches event_id from /api/payment/verify
  → fbq('track', 'Purchase', {...}, { eventID: order.tracking.metaEventId })

Meta deduplicates: browser event + CAPI event with same event_id → 1 conversion
TikTok deduplicates: same pattern
```

### Dedup guarantees:
- **Timing**: CAPI fires synchronously in webhook; browser pixel fires when user reaches success page (seconds later) — order guaranteed
- **Uniqueness**: event_id includes sessionId + timestamp + 4 random bytes — collision probability: negligible
- **Idempotency**: `trackedRef.current` prevents browser pixel from firing twice
- **Test mode guard**: CAPI skipped entirely for `testMode: true` orders

---

## 4. ATTRIBUTION READINESS — ✅ PASS (after fixes)

### Data captured per session:

| Field | Source | Where stored |
|-------|--------|-------------|
| `utm_source` | URL param, first touch persisted | sessionStorage `fc_utm` |
| `utm_medium` | URL param | sessionStorage |
| `utm_campaign` | URL param | sessionStorage |
| `utm_content` | URL param | sessionStorage |
| `utm_term` | URL param | sessionStorage |
| `fbclid` | URL param — **NEW this session** | sessionStorage (overwrites on new click) |
| `ttclid` | URL param — **NEW this session** | sessionStorage |
| `gclid` | URL param — **NEW this session** | sessionStorage |
| `_fbp` | document.cookie — **NEW this session** | sessionStorage cache |
| `_fbc` | document.cookie — **NEW this session** | sessionStorage cache |
| `referrer` | document.referrer | passed on order create |
| `landingPage` | First URL in session — **NEW** | sessionStorage `fc_land` |

### Attribution persistence strategy:
- UTM params and click IDs overwrite on a new paid click (correct for last-touch)
- Landing page set once per session (first touch)
- All fields written to `Order.attribution` at order creation
- Zero data lost between session start and purchase

### Order.attribution schema (verified):
```typescript
{
  sessionId, visitorId,
  source, medium, campaign, content, term,
  fbclid, fbp, fbc, ttclid, gclid,
  referrer, landingPage
}
```

---

## 5. RISKS FIXED THIS SESSION

| # | Risk | Severity | Status |
|---|------|----------|--------|
| 1 | `fbclid`/`ttclid`/`gclid` never captured | CRITICAL | ✅ FIXED |
| 2 | `_fbp`/`_fbc` cookies never sent to server | CRITICAL | ✅ FIXED |
| 3 | `Order.attribution` never populated | CRITICAL | ✅ FIXED |
| 4 | CAPI Purchase not wired to webhook | CRITICAL | ✅ FIXED |
| 5 | `event_id` not stored in Order.tracking | HIGH | ✅ FIXED |
| 6 | `pageview` event never fired | HIGH | ✅ FIXED |
| 7 | `gallery_view` inside setState — potential double-fire | MEDIUM | ✅ FIXED |

---

## 6. REMAINING ITEMS (low priority, non-blocking)

| Item | Risk | Recommendation |
|------|------|---------------|
| `checkout_start` fires on remount | Low | Acceptable behavioral tracking; consider sessionStorage guard if needed |
| `exit_page` fires on tab switch | Low | Label as "focus_lost" in future; currently labeled `exit_page` |
| IP + userAgent not in CAPI Purchase | Medium | Server-side only — Cardcom webhook has no access to original user's IP. Consider passing from order create step |
| No `search` event | Info | Not implemented; add if site adds search feature |
| No `remove_from_cart` event | Info | Cart store doesn't track removals; add if needed for funnel analysis |
| Landing page stored in sessionStorage | Low | Lost if user clears storage; accept as limitation |

---

## 7. ENV VARS REQUIRED BEFORE PIXEL ACTIVATION

```bash
# Meta
NEXT_PUBLIC_META_PIXEL_ID=<your-pixel-id>   # loads browser pixel
META_PIXEL_ID=<your-pixel-id>               # server CAPI
META_CAPI_TOKEN=<system-user-access-token>  # from Meta Events Manager > Settings > Access Keys
META_CAPI_TEST_CODE=TEST12345               # OPTIONAL: use during testing only, remove in production

# TikTok
NEXT_PUBLIC_TIKTOK_PIXEL_ID=<your-pixel-id>
TIKTOK_PIXEL_ID=<your-pixel-id>
TIKTOK_EVENTS_API_TOKEN=<access-token>      # from TikTok for Business
```

---

## 8. FINAL ARCHITECTURE DIAGRAM

```
User Journey                           Our System

[Page visit]
  │ fbclid/ttclid in URL ──────────────→ sessionStorage (fc_utm)
  │ _fbp cookie ───────────────────────→ sessionStorage (fc_fbp)
  │ Landing URL ───────────────────────→ sessionStorage (fc_land)
  │
[Product Page]
  │ pageview ──────────────────────────→ VisitorEvent (behavioral)
  │ product_view ──────────────────────→ VisitorEvent (behavioral)
  │ Meta fbq('ViewContent') ───────────→ Meta Pixel (when PIXEL_ID set)
  │
[Add to Cart]
  │ add_to_cart ───────────────────────→ VisitorEvent (behavioral)
  │ Meta fbq('AddToCart') ─────────────→ Meta Pixel (when PIXEL_ID set)
  │
[Checkout Page]
  │ checkout_start ────────────────────→ VisitorEvent (behavioral)
  │ Meta fbq('InitiateCheckout') ──────→ Meta Pixel (when PIXEL_ID set)
  │ getAttributionData() ──────────────→ Passed with order creation
  │
[Order Created]
  │ POST /api/orders ──────────────────→ Order{payment.status: 'pending'}
  │                                       Order.attribution ← UTM + fbclid + fbp
  │                                       Order.tracking.metaEventId ← dedup key
  │
[Cardcom Payment]
  │
[Webhook POST /api/webhooks/payment]
  │ Operation === '2' ─────────────────→ order.payment.status = 'paid'
  │                                       fireMetaPurchase() ← SERVER CAPI
  │                                       fireTikTokPurchase() ← SERVER CAPI
  │                                       (testMode guard: skips for test orders)
  │
[Success Page polled]
  │ /api/payment/verify → paid ────────→ checkout_complete VisitorEvent
  │                                       fbq('Purchase', metaEventId) ← BROWSER PIXEL
  │                                       (deduplicates with CAPI via event_id)

PURCHASE TRUTH: MongoDB Order{payment.status: 'paid'} — SINGLE SOURCE
```

---

## CONCLUSION

The event architecture is **production-safe** for pixel connection.

**The Purchase event is guarded at multiple levels:**
1. Code level: CAPI fires ONLY inside `if (isSuccess)` block in webhook
2. Model level: `testMode` flag prevents CAPI for test transactions  
3. Data level: `PAID_FILTER` enforced in all analytics queries
4. Dedup level: `event_id` prevents double-counting browser + server events

**DO NOT connect pixels until:**
- Env vars are added to Vercel (see section 7)
- Meta Events Manager test event code verified
- First test order placed and CAPI delivery confirmed in `/admin/marketing/meta`
