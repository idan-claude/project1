# PROGRESS.md — FindCard EOS Build Log
Last updated: 2026-05-25

## COMPLETED ✅

### Core Infrastructure
- [x] Next.js 14 App Router structure
- [x] MongoDB + Mongoose (8 models: Product, Order, User, Category, Coupon, Settings, CommLog, ShipmentEvent)
- [x] Custom JWT admin auth (`withAdminAuth`, cookie `admin_token`)
- [x] Admin login credentials: `ADMIN_EMAIL=findcardsupport@gmail.com`, `ADMIN_PASSWORD=F123456c!`

### Admin Panel — Real DB (no mock data)
- [x] `/admin/products` — real products from DB, fixed JSON parse crash
- [x] `/admin/coupons` — real Coupon model, create/delete/toggle persist in DB
- [x] `/admin/payments` — real API from Order model
- [x] `/admin/invoices` — real API from Order model, print popup
- [x] `/admin/abandoned-carts` — clean empty state (no model yet)
- [x] `/admin/settings` — rewrote: FindCard name, correct email, clean fields
- [x] Seeded correct store settings into DB via `scripts/seed-settings.ts`

### Product Page
- [x] ReviewCarousel: 3 reviews with auto-advance (4.5s) + clickable dots
- [x] Original professional SVGs: product-1-hero, product-2-wallet, product-3-bundle, product-4-features
- [x] Savings display: whole numbers (₪299 exactly)
- [x] Gallery uses local SVG paths

### Store Logic
- [x] Shipping always free (`shippingCost = 0` in API + cart UI updated)
- [x] Removed "fast delivery" and "door to door" mentions from all pages
- [x] Removed all mock/hardcoded data from admin panel

### Environment
- [x] `NEXTAUTH_URL=https://project1-flame-phi.vercel.app`
- [x] `ADMIN_EMAIL_TO=findcardsupport@gmail.com`
- [x] `scripts/auto-backup.sh` created (30-min commit+push with retry)

---

## IN PROGRESS 🔄

### URL Update
- [x] `.env.local` NEXTAUTH_URL updated to `https://project1-flame-phi.vercel.app`
- [ ] Verify Vercel env vars are set correctly on the dashboard

---

## NOT STARTED ❌ (High Priority)

### Critical Store Logic
- [ ] Inventory decrement on checkout (Order creation does NOT reduce product quantity)
- [ ] Apply coupon at checkout (checkout form ignores Coupon model entirely)
- [ ] Customer auth/login UI (NextAuth configured but no customer-facing login page)

### Admin Panel — Missing Real APIs
- [ ] `/admin/reviews` — mock data, needs Review model + API
- [ ] `/admin/reports` — mock data, needs real aggregation API from Order model
- [ ] `/admin/whatsapp` — template management (Twilio not fully active)

### Scheduled Jobs
- [ ] Cron job for scheduled emails (`processPendingScheduled()` in CommLog)
- [ ] Enable crontab for auto-backup: `*/30 * * * * /Users/idanyehiel/Documents/project1/scripts/auto-backup.sh >> /tmp/findcard-backup.log 2>&1`

### CTO Mode — EOS Features
- [ ] Executive dashboard with real AI insights (real aggregation queries)
- [ ] Session analytics / visitor tracking
- [ ] Customer 360 CRM view
- [ ] Marketing automation flow builder
- [ ] A/B testing system
- [ ] Fraud detection
- [ ] 17Track shipment tracking (API key required)
- [ ] Autosave + change history for admin

---

## DECISIONS MADE 📋

1. Shipping: Always free (hardcoded `shippingCost = 0`)
2. Product images: Original SVGs (black card), NOT competitor images
3. Admin auth: Custom JWT (not NextAuth) — `withAdminAuth` wrapper
4. Prices stored in agorot (1/100 NIS) — always divide by 100 for display
5. Production URL: `https://project1-flame-phi.vercel.app`
6. MongoDB: Currently local (`localhost:27017`) — needs Atlas URI for true production
