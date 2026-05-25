# NEXT_STEPS.md — Where to Resume
Last updated: 2026-05-25

## Resume Point

When continuing after a reset, start here in order:

### Step 1 — Verify production URL is live
1. Check `https://project1-flame-phi.vercel.app` loads correctly
2. Verify Vercel environment variables include:
   - `NEXTAUTH_URL=https://project1-flame-phi.vercel.app`
   - `MONGODB_URI=<Atlas connection string>`
   - All other keys from `.env.local`

### Step 2 — Fix inventory decrement (CRITICAL)
File: `src/app/api/orders/route.ts`
After `await order.save()`, add:
```typescript
// Decrement stock for each item
for (const item of validatedItems) {
  await Product.findByIdAndUpdate(item.productId, {
    $inc: { quantity: -item.quantity }
  })
}
```

### Step 3 — Connect coupon at checkout (CRITICAL)
File: `src/app/api/orders/route.ts` (or checkout API)
- Read `couponCode` from request body
- Validate against Coupon model (active, not expired, minOrder check)
- Apply discount to `pricing.total`
- Increment `coupon.uses`

### Step 4 — Fix admin reviews (mock → real DB)
1. Create `src/lib/db/models/Review.ts`:
   ```typescript
   { productId, customer: { name, email }, rating, text, approved, createdAt }
   ```
2. Create `src/app/api/admin/reviews/route.ts`: GET list + PATCH approve/reject
3. Update `src/app/admin/reviews/page.tsx` to use real API

### Step 5 — Fix admin reports (mock → real DB)
File: `src/app/admin/reports/page.tsx`
Create `src/app/api/admin/reports/route.ts` with MongoDB aggregation:
- Revenue by day (last 30 days)
- Top products by revenue
- Order count by status

### Step 6 — Real executive dashboard KPIs
File: `src/app/api/admin/dashboard/route.ts`
Add real aggregation for: today revenue, month revenue, new customers, avg order value

---

## Critical Decisions to Remember

1. Production URL: `https://project1-flame-phi.vercel.app`
2. Admin login: `findcardsupport@gmail.com` / `F123456c!`
3. Prices in agorot (÷100 for display)
4. Shipping always free (`shippingCost = 0`)
5. Black card SVGs only — NOT competitor images, NOT blue card
6. All admin data must come from MongoDB — no hardcoded arrays

## Enable Auto-backup (user must run once)
```bash
crontab -e
# Add this line:
*/30 * * * * /Users/idanyehiel/Documents/project1/scripts/auto-backup.sh >> /tmp/findcard-backup.log 2>&1
```
