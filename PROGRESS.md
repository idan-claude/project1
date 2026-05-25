# PROGRESS.md — FindCard EOS Build Log
Last updated: 2026-05-25

## Sprint 3 — IN PROGRESS (2026-05-25)

### Phase 1 — Critical Bug Fixes ✅
- ✅ **CRITICAL: Fixed orders API** — Added slug fallback in `Product.findById()` → now orders can be created even when `productId` is a slug string
- ✅ **Product page now reads from MongoDB** — Fetches real product on mount, uses real `_id` as `productId`, derives tier prices from `pricing.sellingPrice`, shows real stock status
- ✅ **Fixed Cardcom routing** — Integrations page now routes Cardcom → `/admin/payments`, Twilio → `/admin/whatsapp`

### Phase 2 — Admin Settings Upgrade ✅
- ✅ **Real settings page with 4 credential tabs** — Store Info, Cloudinary, SMTP Email, Twilio WhatsApp — all save to MongoDB via Settings model
- ✅ **Status badges** — Each integration shows "מוגדר ✓" or "חסר" based on saved credentials

### Phase 3 — Marketing System ✅
- ✅ **EmailCampaign model** — Full MongoDB model with segments (all/paid/unpaid/abandoned/custom), stats tracking, schedule support
- ✅ **Campaigns API** — GET/POST `/api/admin/campaigns`, GET/PATCH/DELETE/POST(send) `/api/admin/campaigns/[id]`
- ✅ **Campaigns admin page** — `/admin/campaigns` with create modal, send button, stats display, segment selection
- ✅ **Admin nav updated** — Campaigns added to sidebar under "שיווק ומכירות"

### Phase 4 — Real Analytics ✅
- ✅ **Real conversion rate** — Dashboard now calculates from VisitorEvent + Order data (30-day window), no more hardcoded 3.2%
- ✅ **Real cart rate** — Calculated from product_view → add_to_cart funnel in VisitorEvent
- ✅ **Dashboard metrics row** — Shows avg order value, conversion rate, cart rate side by side

### Phase 5 — WhatsApp Real ✅
- ✅ **WhatsApp page rebuilt** — Now shows real DB automations filtered by channel=whatsapp/both, toggle active/paused, link to create more

---

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

---

## COMPLETED ✅

### Core Infrastructure
- [x] Next.js 14 App Router structure
- [x] MongoDB + Mongoose (10 models: Product, Order, User, Category, Coupon, Settings, CommLog, ShipmentEvent, Review, EmailCampaign)
- [x] Custom JWT admin auth (`withAdminAuth`, cookie `admin_token`)
- [x] Admin login: `findcardsupport@gmail.com` / `F123456c!`
- [x] Production URL: `https://project1-flame-phi.vercel.app`

### Admin Panel — All Real DB (no mock data)
- [x] `/admin/products` — real products from DB
- [x] `/admin/orders` — real orders from DB
- [x] `/admin/customers` — aggregated from Order model (shows guest buyers too)
- [x] `/admin/coupons` — real Coupon model, create/delete/toggle persist in DB
- [x] `/admin/payments` — real API from Order model + Cardcom settings tab
- [x] `/admin/invoices` — real API from Order model, print popup
- [x] `/admin/reviews` — real Review model + API (approve/reject/delete)
- [x] `/admin/reports` — real MongoDB aggregation (revenue/orders by period, top products)
- [x] `/admin/abandoned-carts` — real VisitorEvent-based detection
- [x] `/admin/settings` — 4-tab credential manager (store/cloudinary/smtp/twilio)
- [x] `/admin/whatsapp` — real automations from DB, manual template sender
- [x] `/admin/campaigns` — EmailCampaign model, create/send/delete, stats

### Store Logic
- [x] Inventory decrement on order creation
- [x] Stock validation before order
- [x] Coupon validation at checkout
- [x] Product page fetches real DB data on mount (pricing, stock, images)
- [x] `productId` in cart is real MongoDB `_id` (not slug)
- [x] Orders API: slug fallback so orders always work

---

## NOT STARTED ❌ (Priority Order)

### Critical for Production
1. [ ] **MongoDB Atlas URI** — `.env.local` `MONGODB_URI` points to `localhost:27017`. Production Vercel needs Atlas URI.
2. [ ] **Cardcom credentials** — `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_USERNAME`, `CARDCOM_API_PASSWORD`
3. [ ] **SMTP credentials** — `SMTP_USER`, `SMTP_PASSWORD`
4. [ ] **Cloudinary credentials** — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Sprint 4 Candidates
5. [ ] Customer auth / login UI (NextAuth configured but no customer-facing login page)
6. [ ] CommLog cron job for scheduled email sequences
7. [ ] 17Track shipment tracking
8. [ ] A/B testing system
9. [ ] Collections/categories storefront navigation
10. [ ] Bulk product operations

---

## DECISIONS MADE 📋

1. Prices stored in agorot (1/100 NIS) — always divide by 100 for display
2. Shipping always free (`shippingCost = 0`)
3. Product images: original black card SVGs (not competitor images)
4. Admin auth: Custom JWT — NOT NextAuth
5. Customers: derived from Order model (guest buyers included)
6. Production URL: `https://project1-flame-phi.vercel.app`
7. MongoDB: local for dev, needs Atlas for production
8. Product page tiers: calculated from DB `sellingPrice` — tier 1 = base, tier 2 = 1.5x, tier 3 = 1.9x
