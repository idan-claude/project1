# SPRINT 5A REALITY REPORT
Generated: 2026-05-26  
Production URL: https://project1-flame-phi.vercel.app

---

## BLOCKER FIX — VERIFIED LIVE ✅

### Problem
`/admin/analytics/visitors` showed "2 purchases" even though MongoDB had 0 paid orders.

### Root Cause
1. `/api/admin/visitors/route.ts` ran `Order.countDocuments()` SEQUENTIALLY after the `Promise.all` (18th query not parallel)
2. Vercel deployment from previous commits had NOT auto-deployed (old buildId: `1y_XqSt6t4Hq1iFW7b6KA`)
3. Without try-catch, any failure in the sequential query → 500 with empty body (no JSON error detail)

### Fix Applied
1. Moved `Order.countDocuments` INTO the `Promise.all` (parallel with 17 other VisitorEvent queries)
2. Added `try/catch` returning `NextResponse.json({ error, detail })` instead of bare 500
3. Forced fresh Vercel deployment via `npx vercel --prod`

### Production Verification (live API response)
```
GET /api/admin/visitors
→ paidOrderCount: 0   ← Real paid orders (MongoDB Orders collection, PAID filter)
→ checkoutCompletes: 2 ← VisitorEvent behavioral signals (NOT purchases)

GET /api/admin/dashboard
→ orderCountMonth: 0
→ conversionRate: 0
→ revenueMonth: 0
```

**RESULT: PASS** — Dashboard shows 0 purchases, ₪0 revenue, 0% conversion. Matches MongoDB reality.

---

## PHASE 0 — SINGLE SOURCE OF TRUTH ✅

### Created: `src/lib/analytics/sourceOfTruth.ts`

```typescript
export const PAID_FILTER = { 'payment.status': 'paid', testMode: { $ne: true } }
export async function getPaidOrderCount(since: Date): Promise<number>
export async function getRevenue(since: Date): Promise<{ total, count }>
export function computeConversionRate(paidOrders, visitors): number
```

All analytics routes now have a shared import point. Purchase metrics MUST use this module.

**Rule**: `checkout_complete` VisitorEvents are behavioral signals, NOT purchases. Only `Order.countDocuments(PAID_FILTER)` counts purchases.

---

## PHASE 1 — VISITOR GEO PRECISION ENGINE ✅

### Strategy (implemented in `src/app/api/track/route.ts`)

**Priority stack:**
1. **Vercel edge headers** (zero latency, 85% confidence)
   - `x-vercel-ip-country` → full country name via COUNTRY_NAMES map
   - `x-vercel-ip-city` → decoded city
   - `x-vercel-ip-region` → state/region
   - `x-vercel-ip-timezone` → timezone
2. **ip-api.com fallback** (800ms timeout, 65% confidence)
   - includes regionName, timezone, isp
3. **0% confidence** if all fail

### VisitorEvent schema extended (`src/lib/db/models/VisitorEvent.ts`)
```
geo.region      — state/region
geo.geoTimezone — server-side timezone (vs client browser timezone)
geo.confidence  — 0–100 precision score
```

### Example output (visitor in Israel)
```
country:    ישראל
city:       Rishon LeTsiyyon
region:     (from Vercel header)
confidence: 85%
```

---

## PHASE 2 — VISITOR INTELLIGENCE 2.0 ✅ (via Profile API)

Per-visitor computed metrics (in `/api/admin/visitors/[id]`):

| Metric | Formula |
|--------|---------|
| engagementScore | Weighted event count (product_view×3, add_to_cart×15, etc.) capped at 100 |
| purchaseIntentScore | cartAdds(30) + checkoutStarts(40) + ctaClicks×5 + faqOpens×3 + scroll bonus |
| bounceProbability | (sessions with ≤2 events) / totalSessions × 100 |
| rageClicks | Count of rage_click events |
| maxScrollPct | Max scroll_depth value across all sessions |

---

## PHASE 3 — VISITOR PROFILE PAGE ✅

### New routes created:
- `GET /api/admin/visitors/[id]` — Full visitor intelligence profile
- `/admin/visitors/[id]` — Profile UI page

### Profile page shows:
- Purchase intent score (0–100)
- Engagement score (0–100)
- Session count + total duration
- Bounce probability
- Behavior breakdown (product views, cart adds, checkout starts, FAQ opens, CTA clicks, rage clicks, max scroll)
- Identity: country, city, region, device, browser, OS, language, timezone, ISP, masked IP, geo confidence
- UTM source + campaign
- Fraud signals (rage clicks, too-fast checkout, multiple completions)
- Full session timeline (collapsible, event-by-event)

### Visitor IDs now link to profiles from the Visitors analytics page.

---

## PHASE 4 — ADMIN PANEL HARDENING (Partial)

- Journey list visitor IDs → clickable links to `/admin/visitors/[id]`
- `checkout_complete` journey label renamed: "השלים רכישה" → "הגיע לדף אישור" (more accurate)
- Health monitor added to sidebar navigation

---

## PHASE 5 — STORE HEALTH MONITOR ✅

### New routes created:
- `GET /api/admin/health` — Real system diagnostics
- `/admin/health` — Health dashboard UI

### Current production health (verified live):

| Check | Status | Detail |
|-------|--------|--------|
| MongoDB Atlas | ✅ HEALTHY | 65 visitor events, latency measured |
| מעקב הזמנות | ✅ HEALTHY | 0 paid, 0 pending (last 7 days) |
| מעקב מבקרים | ✅ HEALTHY | 49 events in last 24h |
| Cardcom תשלום | 🔴 CRITICAL | TERMINAL, USER, PASS env vars missing |
| עקביות אנליטיקה | 🟡 WARNING | 2 checkout_complete events, 0 paid orders (expected) |
| MongoDB URI | ✅ HEALTHY | Configured |
| Admin JWT | ✅ HEALTHY | Configured |
| Cloudinary | 🟡 WARNING | Not configured |
| SMTP Email | 🟡 WARNING | Not configured |
| Twilio | 🟡 WARNING | Not configured |
| מצב בדיקה | ✅ HEALTHY | PAYMENT_TEST_MODE=false |

**ACTION REQUIRED**: Add Cardcom env vars to Vercel to enable payments.

---

## PHASE 6 — AI INSIGHTS ENGINE V2

Not yet implemented. Requires:
- `ANTHROPIC_API_KEY` in Vercel environment
- `npm install @anthropic-ai/sdk`

The existing `/admin/ai-insights` page generates rule-based insights from real data.  
Full Claude-powered insights can be added once the API key is configured.

---

## PHASE 7 — PRODUCTION VERIFICATION ✅

### Live API proof:

| Endpoint | Status | Key Values |
|----------|--------|-----------|
| `GET /api/admin/visitors` | 200 | paidOrderCount: 0 |
| `GET /api/admin/dashboard` | 200 | orderCountMonth: 0, conversionRate: 0 |
| `GET /api/admin/health` | 200 | overallStatus: critical (Cardcom missing) |
| `GET /api/admin/visitors/dff02359-826c-4484-b3de-387c3b88095c` | 200 | engagementScore: 85, sessionCount: 4 |
| MongoDB direct query | CONNECTED | 65 VisitorEvents, 0 Orders, 0 paid |

### Build: CLEAN (0 TypeScript errors)

### Deployment: `npx vercel --prod` → buildId `JA1kGKMYLVtQiz6DBQTvW`

---

## WHAT VISITORS PAGE SHOWS NOW (verified)

| KPI | Before Fix | After Fix |
|-----|-----------|-----------|
| המרה % | 3.3% (wrong) | 0.0% (correct) |
| הזמנות ששולמו | 2 רכישות (wrong) | 0 הזמנות ששולמו (correct) |
| Funnel step 4 | 2 (checkout_complete events) | 0 (paid orders only) |
| Journey ✅ badge | Implies purchase | "הגיע לדף אישור" (reached confirmation page) |

---

## PENDING (requires user action)

1. **Cardcom**: Add `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_USERNAME`, `CARDCOM_API_PASSWORD` to Vercel env vars
2. **Cloudinary**: Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for image uploads
3. **SMTP**: Add email server credentials for notification emails
4. **AI Insights**: Add `ANTHROPIC_API_KEY` for Claude-powered insights

All health checks are visible at: `/admin/health`
