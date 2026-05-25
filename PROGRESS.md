# PROGRESS.md — FindCard EOS Build Log
Last updated: 2026-05-25

## Sprint 2 — COMPLETED ✅ (2026-05-25)

### Phase 1 — Fixed Core Systems
- ✅ ProductForm full rebuild — Cloudinary upload, drag-drop gallery, variants management, SEO, shipping tabs
- ✅ Admin products page — dark theme, status filters (all/active/draft/archived), duplicate button
- ✅ /api/admin/upload — Cloudinary image upload (handles missing credentials gracefully)
- ✅ /api/admin/products/[id]/duplicate — duplicate product as draft
- ✅ Cardcom baseUrl fix — uses VERCEL_URL fallback, no longer points to localhost
- ✅ Admin payments page rebuilt — Cardcom settings (save to DB), transaction logs, webhook URLs, provider list
- ✅ /admin/analytics/visitors — full real visitor analytics (funnel, devices, referrers, hourly chart)
- ✅ Automations page — real DB-backed with Automation model, create/toggle/edit/delete, seed defaults
- ✅ Funnels page — real data from VisitorEvent + Orders, drop-off analysis, AI recommendations
- ✅ Team page — shows real audit log activity, removes all placeholder labels
- ✅ Product page — dir="rtl" explicit, thumbnail strips dir="ltr", FEATURES Hebrew-first, ltr spans for brand names

### Phase 2 — Conversion Optimization
- ✅ /api/admin/conversion — funnel analysis, exit pages, friction detection, revenue stats
- ✅ AI Insights page — real actionable recommendations based on actual DB data

### Phase 3 — Email + WhatsApp Automation
- ✅ Automation model in MongoDB
- ✅ /api/admin/automations + /[id] — full CRUD
- ✅ triggerAutomation() utility — fires on order_confirm after payment webhook
- ✅ Abandoned cart detection API + page (real VisitorEvent aggregation)

### Phase 4 — Multi-store Foundation
- ✅ storeId field on Product model (default: 'default', indexed)
- ✅ storeId field on Order model (default: 'default', indexed)

## COMPLETED ✅

### Core Infrastructure
- [x] Next.js 14 App Router structure
- [x] MongoDB + Mongoose (9 models: Product, Order, User, Category, Coupon, Settings, CommLog, ShipmentEvent, Review)
- [x] Custom JWT admin auth (`withAdminAuth`, cookie `admin_token`)
- [x] Admin login: `findcardsupport@gmail.com` / `F123456c!`
- [x] Production URL: `https://project1-flame-phi.vercel.app`

### Admin Panel — All Real DB (no mock data)
- [x] `/admin/products` — real products from DB
- [x] `/admin/orders` — real orders from DB
- [x] `/admin/customers` — aggregated from Order model (shows guest buyers too)
- [x] `/admin/coupons` — real Coupon model, create/delete/toggle persist in DB
- [x] `/admin/payments` — real API from Order model
- [x] `/admin/invoices` — real API from Order model, print popup
- [x] `/admin/reviews` — real Review model + API (approve/reject/delete)
- [x] `/admin/reports` — real MongoDB aggregation (revenue/orders by period, top products)
- [x] `/admin/abandoned-carts` — clean empty state
- [x] `/admin/settings` — FindCard branding, correct email, clean fields
- [x] `/admin/whatsapp` — template manager, removed mock log

### Store Logic
- [x] Inventory decrement on order creation (`inventory.quantity` decremented per item)
- [x] Stock validation before order (blocks if insufficient quantity)
- [x] Coupon validation at checkout (validates + applies discount server-side)
- [x] Coupon usage counter increments on order
- [x] Coupon field in checkout UI (apply button, discount shown in summary)
- [x] `/api/coupons/validate` — public endpoint for coupon preview
- [x] Shipping always free (hardcoded in API + cart UI)

### Product Page
- [x] ReviewCarousel: 3 reviews with auto-advance (4.5s) + clickable dots
- [x] Original professional SVGs: product-1-hero, product-2-wallet, product-3-bundle, product-4-features (BLACK card)
- [x] Savings display: whole numbers (₪299 exactly)
- [x] Gallery uses local SVG paths

### Environment
- [x] `NEXTAUTH_URL=https://project1-flame-phi.vercel.app`
- [x] `ADMIN_EMAIL_TO=findcardsupport@gmail.com`
- [x] `scripts/auto-backup.sh` — auto-commits + pushes every file change

---

## NOT STARTED ❌ (Priority Order)

### Critical for Production
1. [ ] **MongoDB Atlas URI** — `.env.local` `MONGODB_URI` points to `localhost:27017`. Production Vercel needs Atlas.
2. [ ] **Enable crontab for auto-backup** — user must run once manually
3. [ ] **Cardcom credentials** — `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_USERNAME`, `CARDCOM_API_PASSWORD` are empty
4. [ ] **SMTP credentials** — `SMTP_USER`, `SMTP_PASSWORD` are empty (emails won't send)

### CTO Mode — EOS Features
5. [ ] Customer auth / login UI (NextAuth configured but no customer-facing login page)
6. [ ] CommLog cron job for scheduled email sequences
7. [ ] 17Track shipment tracking (needs `TRACK17_API_KEY`)
8. [ ] Twilio WhatsApp automation (needs credentials + active Twilio account)
9. [ ] Session analytics / visitor tracking
10. [ ] A/B testing system
11. [ ] Fraud detection

---

## DECISIONS MADE 📋

1. Prices stored in agorot (1/100 NIS) — always divide by 100 for display
2. Shipping always free (`shippingCost = 0`)
3. Product images: original black card SVGs (not competitor images)
4. Admin auth: Custom JWT — NOT NextAuth
5. Customers: derived from Order model (guest buyers included)
6. Production URL: `https://project1-flame-phi.vercel.app`
7. MongoDB: local for dev, needs Atlas for production
