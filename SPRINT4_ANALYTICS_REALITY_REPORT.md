# SPRINT 4 ANALYTICS REALITY REPORT
Generated: 2026-05-26 (Updated — Test Order Contamination Fix)
Production URL: https://project1-flame-phi.vercel.app
Mandate: TRUTH FIRST — no mock data, no fake positivity, no inflated metrics

---

## ROOT CAUSE ANALYSIS — "2 purchases, 3.3% conversion" when zero real orders

### What was happening
The analytics code was querying `Order.countDocuments({ 'payment.status': 'paid' })` — which is correct.
BUT: 2 MongoDB Order documents had `payment.status: 'paid'` from **Cardcom sandbox testing**.

When the payment flow was tested:
1. An order was created → `payment.status: 'pending'`
2. User was redirected to Cardcom sandbox
3. Sandbox returned `Operation: '2'` (same success signal as production)
4. Webhook at `/api/webhooks/payment` set `payment.status = 'paid'` (correct behavior)
5. These 2 "test paid" orders polluted ALL analytics queries

The analytics code was **technically correct** — it was truthfully reporting 2 paid orders.
The problem was the data: sandbox test transactions look identical to real paid orders in MongoDB.

### Why previous sprint fix was insufficient
The previous fix changed `status: { $ne: 'cancelled' }` → `'payment.status': 'paid'`.
This was correct but **did not protect against test/sandbox orders** because:
- Cardcom sandbox fires the exact same webhook as production
- No test marker existed on orders
- No `force-dynamic` on analytics route → possible cached response

---

## ALL FIXES IN THIS SPRINT

### Fix 1: Added `testMode: boolean` to Order schema
**File:** `src/lib/db/models/Order.ts`
**Added:** `testMode: { type: Boolean, default: false, index: true }` to schema + IOrder interface

### Fix 2: Order creation stamps `testMode` from env var
**File:** `src/app/api/orders/route.ts`
**Added:** `testMode: process.env.PAYMENT_TEST_MODE === 'true'` at order creation
**Usage:** Set `PAYMENT_TEST_MODE=true` in Vercel env vars when using Cardcom sandbox.
Orders created in test mode will be permanently flagged and excluded from all analytics.

### Fix 3: All analytics routes exclude `testMode: true` orders
**PAID_FILTER** (applied in all 6 routes):
```typescript
const PAID_FILTER = { 'payment.status': 'paid', testMode: { $ne: true } }
```
This correctly:
- Includes existing orders (no testMode field → `undefined !== true` → included)
- Excludes future sandbox orders (testMode: true → excluded)
- Includes real paid orders (testMode: false → `false !== true` → included)

### Fix 4: Added `force-dynamic` to analytics/route.ts
**File:** `src/app/api/admin/analytics/route.ts`
**Before:** Missing `export const dynamic = 'force-dynamic'` — Next.js could serve cached response
**After:** `export const dynamic = 'force-dynamic'` — always fresh from MongoDB

### Fix 5: Added `force-dynamic` to finance/route.ts
Same as above.

### Fix 6: Built test-order cleanup endpoint
**File:** `src/app/api/admin/orders/test-purge/route.ts`
- `GET /api/admin/orders/test-purge` — lists all paid orders with Cardcom transaction details
- `DELETE /api/admin/orders/test-purge` with body `{ "action": "mark-test", "all": true }` — marks all as testMode
- `DELETE /api/admin/orders/test-purge` with body `{ "action": "delete", "all": true }` — deletes all paid orders

### Fix 7: Built cleanup script
**File:** `scripts/cleanup-test-orders.ts`
```bash
# Dry run (inspect what's in the DB):
! npx ts-node scripts/cleanup-test-orders.ts

# Delete all paid orders (only run when ALL paid orders are sandbox tests):
! npx ts-node scripts/cleanup-test-orders.ts --delete
```

---

## HOW TO CLEAN THE EXISTING 2 TEST ORDERS

The `testMode` filter alone does NOT remove the existing 2 orders (they were created before the testMode field existed). You must delete or mark them.

**Option A — Use the admin API (easiest):**
```bash
# Step 1: Inspect what's there
curl -b "admin_token=<YOUR_TOKEN>" https://project1-flame-phi.vercel.app/api/admin/orders/test-purge

# Step 2: Delete all paid orders (confirm they're all sandbox tests first)
curl -X DELETE -H "Content-Type: application/json" \
  -b "admin_token=<YOUR_TOKEN>" \
  -d '{"action":"delete","all":true}' \
  https://project1-flame-phi.vercel.app/api/admin/orders/test-purge
```

**Option B — MongoDB Atlas console query:**
```javascript
// In MongoDB Atlas Data Explorer > Orders collection:
// First: inspect
db.orders.find({ "payment.status": "paid" }, { orderNumber: 1, "customer.email": 1, "pricing.total": 1, "payment.transactionId": 1 })

// Then: delete all paid orders (only if confirmed to be test orders)
db.orders.deleteMany({ "payment.status": "paid" })
```

**Option C — Local script (requires .env.local with MONGODB_URI):**
```bash
! npx ts-node scripts/cleanup-test-orders.ts          # inspect
! npx ts-node scripts/cleanup-test-orders.ts --delete  # delete
```

---

## EXPECTED STATE AFTER CLEANUP

| Dashboard | Shows |
|-----------|-------|
| Main analytics | הכנסה כוללת: ₪0 · הזמנות: 0 (שולמו בלבד) |
| Finance | ₪0 today / ₪0 month |
| Conversion tab | "אין מספיק נתונים עדיין" (if sessions=0) OR רכישות: 0, שיעור המרה: 0% |
| Funnel page | paidOrders: 0, purchaseConversion: 0% |

---

## PREVENTION GOING FORWARD

When testing with Cardcom sandbox, set in Vercel environment variables:
```
PAYMENT_TEST_MODE=true
```
All orders created with this env var will have `testMode: true` and will be **permanently excluded** from all analytics (purchases, revenue, conversion, AOV, dashboard KPIs).

When going live with real Cardcom terminal, remove or set to:
```
PAYMENT_TEST_MODE=false
```

---

## PASS/FAIL TABLE (FULL HISTORY)

| # | Metric | Issue | Fix Applied | Status |
|---|--------|-------|-------------|--------|
| 1 | Revenue (all-time) | `status: { $ne: 'cancelled' }` | `PAID_FILTER` | ✅ FIXED |
| 2 | Order count (all-time) | Same wrong filter | `PAID_FILTER` | ✅ FIXED |
| 3 | Revenue (7 days) | Wrong filter | `PAID_FILTER` | ✅ FIXED |
| 4 | Revenue (30 days) | Wrong filter | `PAID_FILTER` | ✅ FIXED |
| 5 | Top products revenue | Wrong filter | `PAID_FILTER` | ✅ FIXED |
| 6 | Finance today revenue | Wrong filter | `PAID_FILTER` | ✅ FIXED |
| 7 | Finance month revenue | Wrong filter | `PAID_FILTER` | ✅ FIXED |
| 8 | Finance last month revenue | Wrong filter | `PAID_FILTER` | ✅ FIXED |
| 9 | Finance daily chart | Wrong filter | `PAID_FILTER` | ✅ FIXED |
| 10 | Conversion paidOrders count | No payment filter | `PAID_FILTER` | ✅ FIXED |
| 11 | Conversion Math.max inflation | `Math.max(events, orders)` | Separate values | ✅ FIXED |
| 12 | Analytics/conversion totalConverted | VisitorEvent count | `Order` paid count | ✅ FIXED |
| 13 | Dashboard revenue today/month | Already correct | Unchanged | ✅ PASS |
| 14 | Dashboard conversionRate | Already correct | Unchanged | ✅ PASS |
| 15 | Sidebar visitors link | Missing | Added | ✅ FIXED |
| 16 | UI label implying non-paid counted | "לא בוטלו" | "שולמו בלבד" | ✅ FIXED |
| 17 | Sandbox test orders counted as purchases | No testMode protection | `PAID_FILTER` with `testMode: { $ne: true }` | ✅ FIXED |
| 18 | analytics/route.ts missing force-dynamic | Cache risk | Added `force-dynamic` | ✅ FIXED |
| 19 | finance/route.ts missing force-dynamic | Cache risk | Added `force-dynamic` | ✅ FIXED |
| 20 | Existing test paid orders in MongoDB | Need manual cleanup | Script + API endpoint provided | ⚠️ ACTION REQUIRED |

---

## PURCHASE TRUTH HIERARCHY (FINAL)

```
1. Order.countDocuments({ 'payment.status': 'paid', testMode: { $ne: true } })
   ← ONLY valid source for purchase/revenue metrics

2. VisitorEvent checkout_complete
   ← behavioral signal ONLY (sessions clicked "complete payment"), NOT purchase count

3. NEVER: Order.countDocuments() with no payment filter
4. NEVER: Math.max(eventCount, orderCount)
5. NEVER: count pending/failed/draft/cancelled orders as revenue
6. NEVER: count testMode:true orders (Cardcom sandbox transactions) as revenue
```

---

## ACTION REQUIRED

Row #20 above: **You must manually delete the 2 existing test orders** using one of the three methods above (API endpoint, MongoDB Atlas console, or local script).

After deletion, the dashboard will show:
- Purchases: **0**
- Revenue: **₪0**
- Conversion: **0%**
- AOV: **—**

This is the correct, truthful state with zero real paid orders.
