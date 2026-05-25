# TODO.md — FindCard EOS
Last updated: 2026-05-25

## 🔴 CRITICAL (breaks store functionality)

- [ ] **Inventory decrement** — `src/app/api/orders/route.ts`: after creating order, reduce `Product.quantity` by items ordered. Currently quantity never decrements.
- [ ] **Coupon at checkout** — checkout form (`src/app/checkout/`) never validates or applies coupons. Coupon model exists but is disconnected from checkout.
- [ ] **MongoDB Atlas URI** — `.env.local` `MONGODB_URI` points to `localhost:27017`. Production on Vercel needs Atlas connection string.

## 🟠 HIGH (admin panel incomplete)

- [ ] **Review model + API** — `src/app/admin/reviews/page.tsx` shows mock data. Create `Review.ts` model + `/api/admin/reviews/route.ts`.
- [ ] **Reports API** — `src/app/admin/reports/page.tsx` shows mock data. Build real aggregation from Order model: revenue by day/week/month, top products, conversion rate.
- [ ] **Cron for scheduled emails** — `src/lib/db/models/CommLog.ts` has `processPendingScheduled()` but nothing calls it. Add cron job.

## 🟡 MEDIUM (CTO/EOS features)

- [ ] **Executive dashboard** — `/admin/page.tsx` needs real KPIs: today's revenue, orders, conversion, AOV from DB
- [ ] **Customer auth** — NextAuth configured (`src/app/api/auth/`) but no customer login/register UI
- [ ] **Customer 360** — `/admin/customers/` page: full purchase history, LTV, last seen per customer
- [ ] **17Track integration** — `src/lib/shipment/17track.ts` coded but needs `TRACK17_API_KEY` env var
- [ ] **WhatsApp automation** — Twilio configured, needs active templates + triggers on order events

## 🟢 LOW (nice to have)

- [ ] **Autosave admin** — settings/product edits should auto-save with debounce
- [ ] **A/B testing** — product page variant testing
- [ ] **Fraud detection** — flag suspicious orders (multiple failures, address mismatch)
- [ ] **Session analytics** — visitor tracking, funnel analysis

## ✅ DONE (latest session)

- [x] NEXTAUTH_URL updated to `https://project1-flame-phi.vercel.app`
- [x] ADMIN_EMAIL_TO updated to `findcardsupport@gmail.com`
- [x] Admin coupons — real DB persistence (no more reset on refresh)
- [x] Admin payments — real API from Order model
- [x] Admin invoices — real API from Order model + print popup
- [x] Admin abandoned-carts — clean empty state
- [x] Admin settings — rewritten with correct FindCard branding
- [x] Product page — 3-review carousel with auto-advance + dots
- [x] Product SVGs — original black card design (not competitor images)
- [x] Shipping always free — hardcoded in API + cart UI
- [x] Removed fast delivery / door-to-door mentions
- [x] Auto-backup script: `scripts/auto-backup.sh`

## Quick Reference — Key Files

| Feature | File |
|---|---|
| Admin auth | `src/lib/auth/adminAuth.ts` |
| Order creation | `src/app/api/orders/route.ts` |
| Payment initiate | `src/app/api/payment/initiate/route.ts` |
| Coupon model | `src/lib/db/models/Coupon.ts` |
| Product model | `src/lib/db/models/Product.ts` |
| Settings model | `src/lib/db/models/Settings.ts` |
| CommLog model | `src/lib/db/models/CommLog.ts` |
| Email templates | `src/lib/email/templates.ts` |
| Product page | `src/app/product/page.tsx` |
| Cart drawer | `src/components/cart/CartDrawer.tsx` |
| Auto-backup | `scripts/auto-backup.sh` |
