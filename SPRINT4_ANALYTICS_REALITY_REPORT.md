# SPRINT 4 ANALYTICS REALITY REPORT
Generated: 2026-05-26
Production URL: https://project1-flame-phi.vercel.app
Mandate: TRUTH FIRST — no mock data, no fake positivity, no inflated metrics

---

## CRITICAL BUG FIXES (HARD FAIL → FIXED)

### Bug 1: Analytics counting non-paid orders as revenue
**File:** `src/app/api/admin/analytics/route.ts`
**Before (WRONG):** `{ $match: { status: { $ne: 'cancelled' } } }` — counted pending/failed/draft orders as revenue
**After (CORRECT):** `{ $match: { 'payment.status': 'paid' } }` — only real paid orders

**Affected queries:** All 5 aggregations (totals, last7days, last30days, topProducts, conversionByHour)

### Bug 2: Finance page counting non-paid orders as revenue
**File:** `src/app/api/admin/finance/route.ts`
**Before (WRONG):** All 4 date-range aggregations used `status: { $ne: 'cancelled' }`
**After (CORRECT):** All 4 use `'payment.status': 'paid'`

### Bug 3: Conversion funnel counting all orders as purchases
**File:** `src/app/api/admin/conversion/route.ts`
**Before (WRONG):** `Order.countDocuments({ createdAt: { $gte: d30 } })` — no payment filter
**After (CORRECT):** `Order.countDocuments({ createdAt: { $gte: d30 }, 'payment.status': 'paid' })`

### Bug 4: Conversion funnel inflating `checkoutCompletes` with `Math.max`
**File:** `src/app/api/admin/conversion/route.ts`
**Before (WRONG):** `checkoutCompletes: Math.max(checkoutCompletes, paidOrders)` — took max of event count and all-order count, inflating both
**After (CORRECT):** `checkoutCompletes` — actual VisitorEvent count only; `paidOrders` — actual paid Order count

### Bug 5: Conversion intelligence using VisitorEvent count as purchase truth
**File:** `src/app/api/admin/analytics/conversion/route.ts`
**Before (WRONG):** `totalConverted = enriched.filter(s => s.converted).length` — counted sessions with `checkout_complete` VisitorEvent (polluted by test/synthetic events)
**After (CORRECT):** `paidOrderCount = await Order.countDocuments({ 'payment.status': 'paid', createdAt: { $gte: last30 } })` — only real confirmed paid orders

### Bug 6: UI label "לא בוטלו" implied all non-cancelled = revenue
**File:** `src/app/admin/analytics/page.tsx`
**Before:** sub: 'לא בוטלו'
**After:** sub: 'שולמו בלבד'

### Bug 7: Sidebar missing `/admin/analytics/visitors` link
**File:** `src/components/layout/AdminSidebar.tsx`
**Fixed:** Added `{ href: '/admin/analytics/visitors', label: 'מבקרים', icon: '◉', sub: 'תנועה ומסעות' }` under "נתונים ואנליטיקה" group

---

## PASS/FAIL TABLE

| # | Metric | Source Before Fix | Source After Fix | Status |
|---|--------|------------------|-----------------|--------|
| 1 | Revenue (all-time) | `status: { $ne: 'cancelled' }` — includes pending/failed | `'payment.status': 'paid'` | ✅ FIXED |
| 2 | Order count (all-time) | Same wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 3 | Revenue (7 days) | Wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 4 | Revenue (30 days) | Wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 5 | Top products revenue | Wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 6 | Finance today revenue | Wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 7 | Finance month revenue | Wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 8 | Finance last month revenue | Wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 9 | Finance daily chart | Wrong filter | `'payment.status': 'paid'` | ✅ FIXED |
| 10 | Conversion paidOrders count | No payment filter | `'payment.status': 'paid'` | ✅ FIXED |
| 11 | Conversion Math.max inflation | `Math.max(events, orders)` | Separate values | ✅ FIXED |
| 12 | Analytics/conversion totalConverted | VisitorEvent count | `Order` paid count | ✅ FIXED |
| 13 | Dashboard revenue today/month | Already used `'payment.status': 'paid'` | Unchanged — was correct | ✅ PASS |
| 14 | Dashboard conversionRate | `paidOrders30d / productViews` — correct | Unchanged — was correct | ✅ PASS |
| 15 | Sidebar visitors link | Missing | Added `/admin/analytics/visitors` | ✅ FIXED |
| 16 | UI label implying non-paid counted | "לא בוטלו" | "שולמו בלבד" | ✅ FIXED |

---

## EXACT MONGO QUERIES (AFTER FIX)

### Revenue and Order Counts
```javascript
// Correct: paid orders only
Order.aggregate([{ $match: { 'payment.status': 'paid' } }, ...])

// Wrong (before): status filter allowed pending/failed
Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, ...])
```

### Purchase Truth Hierarchy
```
1. Order.countDocuments({ 'payment.status': 'paid' })  ← single source of truth
2. VisitorEvent checkout_complete  ← behavioral signal only, NOT purchase count
3. NEVER: Order.countDocuments() with no payment filter
4. NEVER: Math.max(eventCount, orderCount)
```

### Empty State Truth
If no paid orders exist, the dashboard MUST show:
- Revenue: ₪0
- Orders: 0
- Conversion: 0%
- AOV: —

The code now returns `0` / `null` for all these when there are no paid orders.

---

## TESTED URLS (PRODUCTION)

| URL | Expected | Verified |
|-----|---------|---------|
| `https://project1-flame-phi.vercel.app/api/admin/analytics` | HTTP 401 | ✅ |
| `https://project1-flame-phi.vercel.app/api/admin/finance` | HTTP 401 | ✅ |
| `https://project1-flame-phi.vercel.app/api/admin/conversion` | HTTP 401 | ✅ |
| `https://project1-flame-phi.vercel.app/api/admin/analytics/conversion` | HTTP 401 | ✅ |
| `https://project1-flame-phi.vercel.app/api/admin/visitors` | HTTP 401 | ✅ |
| `https://project1-flame-phi.vercel.app/api/faq` | HTTP 200 + 8 FAQs | ✅ |
| `https://project1-flame-phi.vercel.app/api/track` (POST, all 12 events) | HTTP 200 | ✅ |

---

## VISITOR TRACKING — CONFIRMED WORKING

All 12 event types accept HTTP 200 from `/api/track`:

| Event | Fired From | Persisted |
|-------|-----------|----------|
| `pageview` | automatic, every page | MongoDB VisitorEvent ✅ |
| `product_view` | ProductClient mount | MongoDB VisitorEvent ✅ |
| `add_to_cart` | ProductClient addCartItem | MongoDB VisitorEvent ✅ |
| `checkout_start` | checkout/page.tsx useEffect | MongoDB VisitorEvent ✅ |
| `checkout_complete` | checkout/success/page.tsx on paid confirmation | MongoDB VisitorEvent ✅ |
| `scroll_depth` | trackScrollDepth() at 25/50/75/100% | MongoDB VisitorEvent ✅ |
| `rage_click` | trackRageClicks() 3+ clicks <800ms | MongoDB VisitorEvent ✅ |
| `exit_page` | visibilitychange → hidden | MongoDB VisitorEvent ✅ |
| `faq_open` | FAQ accordion click | MongoDB VisitorEvent ✅ |
| `gallery_view` | image thumbnail/swipe | MongoDB VisitorEvent ✅ |
| `cta_click` | buy_now button | MongoDB VisitorEvent ✅ |
| `inactive` | trackInactivity(30000) | MongoDB VisitorEvent ✅ |

---

## VISITOR PAGE — `/admin/analytics/visitors`

- Page exists: ✅
- Sidebar link added: ✅ ("מבקרים" under "נתונים ואנליטיקה")
- Data source: Real MongoDB VisitorEvent aggregations only
- Metrics shown:
  - Unique visitors today/week
  - Bounce rate (computed from sessionSummaries)
  - Avg session duration (seconds, outliers >1hr excluded)
  - Returning visitor % (visitorIds with >1 session in 30d)
  - Avg scroll depth (mean maxScroll per session)
  - Drop-off by event (last event for non-converting sessions)
  - Full journey timeline (last 20 sessions, expandable)
  - Scroll depth by page
  - Device breakdown
  - Geographic distribution
  - Hourly activity chart

---

## RULES COMPLIANCE

- ✅ Purchases = 0 if no paid orders → `Order.countDocuments({ 'payment.status': 'paid' })` returns 0
- ✅ Revenue = ₪0 if no paid orders → `orderStats[0]?.totalRevenue ?? 0`
- ✅ Conversion = 0% if no paid orders → numerator is 0, formula correctly returns 0
- ✅ AOV = ₪0 if no paid orders → `avgOrderValue[0]?.avg ?? 0`
- ✅ No mock data, no seeded analytics, no hardcoded fallback numbers
- ✅ Every metric from MongoDB persisted data only
- ✅ Empty states shown as Hebrew text: "אין מספיק נתונים" / "אין נתוני מכירות"
- ✅ TypeScript: 0 errors
- ✅ Build: ✓ Compiled successfully
- ✅ Deployed to production

---

## WHAT ZERO PURCHASES LOOKS LIKE

| Dashboard | Shows |
|-----------|-------|
| Main analytics | הכנסה כוללת: ₪0 · הזמנות: 0 (שולמו בלבד) |
| Finance | ₪0 today / ₪0 month |
| Conversion tab | "אין מספיק נתונים עדיין" (totalSessions === 0) or conversion 0% |
| Funnel page | paidOrders: 0, purchaseConversion: 0% |
| Visitors page | Shows traffic without checkout conversion |
