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

## SPRINT 5A EXTENDED — ADDED 2026-05-27

### PHASE 0 — ANALYTICS TRUTH LOCK ✅

**PAID_FILTER consolidated:** All 6 API routes (`dashboard`, `visitors`, `analytics`, `conversion`, `finance`, `analytics/conversion`) now import `PAID_FILTER` from `src/lib/analytics/sourceOfTruth.ts`. Zero local re-definitions remain.

**Runtime consistency validator:** `validateAnalyticsConsistency()` in `sourceOfTruth.ts` cross-checks paid orders vs checkout_complete events and returns structured warnings.

**Consistency API:** `GET /api/admin/analytics/consistency` — callable by any admin page to detect purchase metric drift.

**AnalyticsConsistencyBanner component:** Shown on `/admin/analytics/visitors`, `/admin/ai-insights`, `/admin/funnels` when warnings are detected. Hidden when analytics are consistent.

---

### PHASE 2 — VISITOR INTELLIGENCE V2 ✅

New behavioral scores in `/api/admin/visitors/[id]`:

| Score | Formula | Range |
|-------|---------|-------|
| hesitationScore | Time from first product_view to first add_to_cart (0=instant, 100=60+ min or never added) | 0–100 |
| frustrationScore | rageClicks×20 + exitPages×10 + bounce bonus | 0–100 |
| attentionScore | scrollDepth×0.4 + duration×0.4 + returning×0.2 | 0–100 |
| ctaHesitationSec | Seconds from first product_view to first CTA click | seconds |

Visitor profile page now shows two score rows: intent/engagement/sessions/bounce + hesitation/frustration/attention/CTA-delay.

---

### PHASE 6 — HEALTH MONITOR EXTENDED ✅

Two new health checks added:
- **מלאי מוצרים**: Detects active products with 0 inventory (CRITICAL) or low stock (WARNING)
- **הזמנה אחרונה**: Shows age of last real paid order — warns if > 7 days old

Existing analytics consistency check now calls shared `validateAnalyticsConsistency()` instead of duplicating logic.

---

### GEO PRECISION FIX ✅

**Problem**: Vercel's MaxMind database was showing wrong Israeli cities (Rishon LeZion instead of Rosh HaAyin for some ISPs).

**Fix**: Swapped geo lookup priority:
- **Priority 1**: ip-api.com (80% confidence, city-level accuracy better for Israeli ISPs like Partner/Hot/Bezeq). Fields: `country`, `city`, `region`, `isp`, `org`, `timezone`, `as` (ASN).
- **Priority 2**: Vercel edge headers fallback (country/region only when ip-api fails).

New field `asn` added to `VisitorEvent.geo` schema and stored in MongoDB.

---

### FULL IP VISIBILITY ✅

**Admin sees full IP — no masking:**
- `/admin/visitors/[id]`: Shows exact IP in copyable code block + "חסום IP" and "חפש ב-Security" buttons
- `/admin/analytics/visitors`: Journey list now shows IP address per session
- `/admin/security` → Blocklist tab: Shows full IP in code element

**Storage**: Full IP was always stored in MongoDB (`VisitorEvent.geo.ip`). Masking was only in API response layer — now removed from admin APIs.

---

### REAL IP BLOCKING ✅

**Architecture:**
1. `IpBlock` model (MongoDB): stores `{ ip, type: 'block'|'whitelist', reason, expiresAt }`
2. `/api/internal/ip-check`: Internal endpoint with 60-second in-process cache, checks IpBlock collection
3. `src/middleware.ts`: Extended to cover all storefront routes — extracts visitor IP, calls ip-check endpoint (500ms timeout, fail-open), redirects blocked IPs to `/blocked`
4. `/blocked` page: Hebrew blocked access page

**Block flow:**
- Admin visits `/admin/visitors/[id]` → clicks "חסום IP"
- Navigates to `/admin/security?block=1.2.3.4` → blocklist tab pre-fills with IP
- Admin submits → IP written to MongoDB IpBlock collection
- Next visitor request from that IP → middleware redirects to `/blocked`
- Cache TTL: 60 seconds (blocks take effect within 1 minute)

**Fail-open**: If MongoDB check fails, visitor is NOT blocked (availability > security by default).

**Admin actions available:**
- Block IP (permanent or with expiry)
- Whitelist IP
- Unblock (delete from blocklist)
- Copy IP to clipboard (visitor profile page)
- Search in Security page

---

## PENDING (requires user action)

1. **Cardcom**: Add `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_USERNAME`, `CARDCOM_API_PASSWORD` to Vercel env vars
2. **Cloudinary**: Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` for image uploads
3. **SMTP**: Add email server credentials for notification emails
4. **AI Insights**: Add `ANTHROPIC_API_KEY` for Claude-powered insights
5. **Deploy**: Push to remote and run `npx vercel --prod --yes` to put all Sprint 5A Extended changes live

All health checks visible at: `/admin/health`
Consistency API: `/api/admin/analytics/consistency`
