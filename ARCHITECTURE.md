# ARCHITECTURE.md — FindCard EOS
Last updated: 2026-05-25

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Database | MongoDB + Mongoose |
| Styling | Tailwind CSS (RTL Hebrew-first) |
| State | Zustand (cart) |
| Admin Auth | Custom JWT (cookie: `admin_token`) |
| Customer Auth | NextAuth.js (configured, no UI yet) |
| Payment | Cardcom (Israeli gateway) |
| Notifications | Twilio WhatsApp |
| Email | Nodemailer (SMTP Gmail) |
| Shipment | 17Track API |
| Hosting | Vercel |
| Images | Local SVG in `public/images/` |

## Production URL
`https://project1-flame-phi.vercel.app`

## Directory Structure

```
src/
  app/
    admin/           # Admin panel pages (RTL Hebrew UI)
      login/         # Admin login
      page.tsx       # Executive dashboard
      products/      # Product management
      orders/        # Order management
      customers/     # Customer CRM
      coupons/       # Coupon management (real DB)
      payments/      # Payment transactions (real DB)
      invoices/      # Invoices with print (real DB)
      reviews/       # Review moderation (MOCK - needs fix)
      reports/       # Analytics (MOCK - needs fix)
      settings/      # Store settings (real DB)
      abandoned-carts/ # Empty state (no model yet)
      whatsapp/      # Template management
    api/
      admin/         # Admin API routes (protected by withAdminAuth)
      auth/          # NextAuth handlers
      orders/        # Order creation + payment flow
      payment/       # Cardcom initiation/callback
      products/      # Public product API
    product/         # Product page (main storefront)
    checkout/        # Checkout flow
    policies/        # Shipping/returns/privacy pages
  components/
    cart/            # CartDrawer (Zustand)
    ui/              # Shared components
  lib/
    auth/
      adminAuth.ts   # withAdminAuth middleware
    db/
      mongoose.ts    # DB connection
      models/        # 8 Mongoose models
        Product.ts   # name, price (agorot), quantity, images
        Order.ts     # orderNumber, customer, items, pricing, payment
        User.ts      # Customer accounts
        Category.ts  # Product categories
        Coupon.ts    # code, type, value, uses, active
        Settings.ts  # Store-wide settings (singleton)
        CommLog.ts   # Scheduled email sequences
        ShipmentEvent.ts # 17Track events
    email/
      templates.ts   # Email HTML templates
    shipment/
      17track.ts     # Shipment tracking
    utils/
      formatPrice.ts # Divide agorot by 100, format as ₪X.XX

public/
  images/
    product-1-hero.svg     # Black card tilted, light bg
    product-2-wallet.svg   # Black card in leather wallet
    product-3-bundle.svg   # 3 cards fanned, dark bg
    product-4-features.svg # Card with Hebrew feature callouts

scripts/
  auto-backup.sh    # Git add + commit + push (run every 30min via cron)
  seed-settings.ts  # Seeds store settings into DB
```

## Admin Auth Flow
1. POST `/api/admin/auth/login` with email+password
2. Compare against `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars
3. Sign JWT with `ADMIN_JWT_SECRET`, set `admin_token` cookie (7 days)
4. `withAdminAuth(handler)` verifies cookie on every admin API call

## Order Flow
1. Cart (Zustand) → Checkout form
2. POST `/api/orders` → creates Order (status: pending)
3. POST `/api/payment/initiate` → calls Cardcom API → returns redirect URL
4. Customer pays on Cardcom → Cardcom POSTs callback to `/api/payment/callback`
5. Callback updates Order status + triggers email/WhatsApp

## Price Convention
All prices stored in **agorot** (1/100 NIS).
- ₪299 = stored as `29900`
- `formatPrice(29900)` → `"₪299.00"`
- compareAt values: Tier 0: 29890, Tier 1: 59890, Tier 2: 79890

## Key Environment Variables
```
NEXTAUTH_URL=https://project1-flame-phi.vercel.app
MONGODB_URI=mongodb://localhost:27017/tracker-store  ← needs Atlas for production
ADMIN_EMAIL=findcardsupport@gmail.com
ADMIN_PASSWORD=F123456c!
ADMIN_JWT_SECRET=change-me-admin-secret
ADMIN_EMAIL_TO=findcardsupport@gmail.com
CARDCOM_TERMINAL_NUMBER=
CARDCOM_API_USERNAME=
CARDCOM_API_PASSWORD=
```
