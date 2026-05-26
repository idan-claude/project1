# CURRENT_REALITY_AUDIT — verified from codebase only
Generated: 2026-05-26  
Scope: Findings are based strictly on repository inspection (models, routes, and code paths). No live HTTP checks, no DB introspection, and no Vercel dashboard inspection were performed in this report.

## Executive summary (truth table)

### Storefront
- **Real and persistent:** `/product` is server-rendered from MongoDB on every request; bundles/page content/layout are read from MongoDB when present.
- **Fake / hardcoded:** the **homepage** (`/`) contains hardcoded product pricing and review arrays (not sourced from MongoDB).

### Admin panel
- **Mostly real and persistent:** admin pages are DB-backed via `/api/admin/*` routes and Mongoose models.
- **Misleading:** multiple “credentials/settings” UIs save to MongoDB Settings, but the production runtime for Cloudinary/Twilio/SMTP/Cardcom **reads credentials from environment variables**, not from Settings. This creates a “looks configured in admin, but does nothing in production” failure mode.

### Production blockers (must be true in runtime env)
- `MONGODB_URI` **must** be set, otherwise the app throws at runtime (DB connection hard-fails).
- Cardcom/SMTP/Twilio/Cloudinary require env vars to actually work; admin Settings values are not used by those runtime senders/uploaders.

---

## 1) What is truly working (verified in code)

### 1.1 MongoDB models exist for core commerce/admin
Verified models:
- Product (includes bundles, pageContent, layout-related fields): `src/lib/db/models/Product.ts`
- Order: `src/lib/db/models/Order.ts`
- Coupon: `src/lib/db/models/Coupon.ts`
- Review: `src/lib/db/models/Review.ts`
- EmailCampaign: `src/lib/db/models/EmailCampaign.ts`
- Automation + CommLog: `src/lib/db/models/Automation.ts`, `src/lib/db/models/CommLog.ts`
- VisitorEvent: `src/lib/db/models/VisitorEvent.ts`
- PageLayout: `src/lib/db/models/PageLayout.ts`
- ProductVersion: `src/lib/db/models/ProductVersion.ts`

### 1.2 Storefront `/product` is real DB → HTML (no client “fetch then replace”)
Verified in `src/app/product/page.tsx`:
- `export const dynamic = 'force-dynamic'`
- `await connectDB()`
- Fetches:
  - Product: `Product.findOne({ slug: PRODUCT_SLUG, status: 'active' }).lean()`
  - Reviews: `Review.find({ status: 'approved' })...`
  - Layout: global default and product-specific via `PageLayout.findOne(...)`
- Passes everything into `ProductClient` as props (real server-side data is the primary source).

### 1.3 Admin product editing is persistent and versioned
Verified in `src/app/api/admin/products/[id]/route.ts`:
- PUT snapshots the “before” document into `ProductVersion` (keeps last 20).
- Enforces slug uniqueness on change (409 conflict if taken).
- Updates product using `findByIdAndUpdate(..., { runValidators: true })`.

### 1.4 Orders API is real DB-backed and validates pricing from DB
Verified in `src/app/api/orders/route.ts`:
- Re-prices items from Product in DB (unit price from `product.pricing.sellingPrice`).
- Validates stock if `trackQuantity` is enabled.
- Applies coupons from DB (`Coupon.findOne({ code, active: true })`) and increments coupon usage.
- Decrements inventory in DB after creating the order.

---

## 2) What is partially working (verified limits in code)

### 2.1 Reviews are real if present, otherwise fallback is used
In `src/app/product/page.tsx`:
- If there are approved reviews in MongoDB, they render.
- If none exist, the storefront uses `FALLBACK_REVIEWS` (hardcoded “sample” reviews list).

Impact: storefront social proof can be “real or fake” depending on DB state; the code explicitly allows a fake fallback.

### 2.2 Bundles are real if set, otherwise generated defaults are used
In `src/app/product/page.tsx`:
- If `product.bundles` has any `active !== false`, they are used exactly (agorot, no rounding).
- Otherwise `buildDefaultBundles()` generates psychological defaults (computed in code).

Impact: bundles are fully DB-controlled *when configured*, but the page will still show a functional (computed) bundle UI even if bundles are missing in DB.

### 2.3 Page layout builder is real, but store scoping is inconsistent
Verified:
- Layout model supports `storeId` and `productId`: `src/lib/db/models/PageLayout.ts`
- Layout API persists layouts: `src/app/api/admin/products/[id]/layout/route.ts`

Issue (partial correctness):
- Storefront fetches global layout using `PageLayout.findOne({ productId: null })` with **no storeId filter**.
- Layout API stores `{ storeId: 'default' }`, but GET reads `findOne({ productId: params.id })` with **no storeId filter**.

Impact: multi-store isolation is not enforced for layouts; cross-store leakage is possible by design in current code.

### 2.4 Visitor tracking captures events, but geo is not implemented
Verified in `src/app/api/track/route.ts`:
- Creates `VisitorEvent` with device parsing and IP extraction.
- Writes `geo: { ip, country: '', city: '' }` (country/city empty).

Impact: “visitor intelligence” exists at an event level, but geo enrichment is not real yet.

---

## 3) What is fake / mock (verified in code)

### 3.1 Storefront homepage (`/`) uses hardcoded product marketing content
In `src/app/page.tsx`:
- Hardcoded constants like `SELLING_PRICE = 19990` and `COMPARE_PRICE = 29900`.
- Hardcoded review objects array `REVIEWS = [...]`.

This page does not fetch from MongoDB in the inspected portion; it is not “single source of truth.”

### 3.2 Storefront `/product` still contains multiple hardcoded fallback blocks
In `src/app/product/page.tsx`:
- `FALLBACK_GALLERY`
- `FALLBACK_FEATURES`
- `FALLBACK_FAQS`
- `FALLBACK_REVIEWS`

Important nuance:
- Gallery/features/FAQ fall back only if DB is missing those fields.
- Reviews explicitly fall back if there are no approved reviews in DB.

---

## 4) What is broken (verified by code contradictions)

### 4.1 Admin “Settings” do not drive runtime integrations (credentials are NOT consumed)
Settings API stores arbitrary key/value documents in MongoDB:
- `src/app/api/admin/settings/route.ts` uses `Settings.findOne({ key })` and `findOneAndUpdate({ key }, ...)`

But the actual integrations read **environment variables**, not Settings:
- Cloudinary upload: `src/app/api/admin/upload/route.ts` reads `process.env.CLOUDINARY_*`
- Email sending / automations: `src/lib/notifications/email.ts`, `src/lib/email/sender.ts`, `src/lib/automation/trigger.ts` read `process.env.SMTP_*`
- WhatsApp: `src/lib/notifications/whatsapp.ts`, `src/lib/automation/trigger.ts` read `process.env.TWILIO_*` and `process.env.ADMIN_WHATSAPP_NUMBER`
- Cardcom initiation: `src/lib/payment/cardcom.ts` reads `process.env.CARDCOM_*`

Result: an admin can “configure” SMTP/Twilio/Cloudinary/Cardcom inside `/admin/settings` (or Cardcom tab in `/admin/payments`), see “saved” state, and still have integrations fail in production because code never reads Settings for runtime credentials.

### 4.2 Cardcom settings UI is persistent, but not wired to Cardcom runtime
Verified:
- Cardcom settings UI saves `key=cardcom` into Settings: `src/app/admin/payments/page.tsx`
- Payment initiation uses `initiateCardcomPayment()` with credentials from env only: `src/lib/payment/cardcom.ts`

So Cardcom “connected” status cannot be determined from Settings, and Settings cannot make Cardcom work.

### 4.3 Automation delay uses `setTimeout` (serverless-hostile)
In `src/lib/automation/trigger.ts`:
- Delayed triggers call `setTimeout(...)` but clamp to max 5 minutes.
- This is explicitly not a persistent queue/cron.

Impact: delayed automations are not reliable in a serverless environment, and >5 minute delays cannot work by design.

### 4.4 Settings schema uniqueness ignores storeId
In `src/lib/db/models/Settings.ts`:
- `key` is `unique: true` without scoping by `storeId`.

Impact: multi-store settings cannot be isolated; `storeId` field exists but uniqueness guarantees are global by key.

---

## 5) Sync issues between admin and storefront (verified in code)

### 5.1 Product data sync (admin → storefront) is real for `/product` and `/api/products/[slug]`
Verified:
- Admin writes Product in MongoDB via `/api/admin/products/[id]`.
- Storefront reads Product from MongoDB via:
  - `src/app/product/page.tsx` (server component), and
  - `src/app/api/products/[slug]/route.ts` (JSON API).

### 5.2 StoreId scoping is not consistently enforced across read/write paths
Examples:
- Product model has `storeId`, but storefront `/product` fetch does not filter by storeId.
- Layout reads/writes omit storeId filters (see section 2.3).
- Settings GET/POST omit storeId entirely and use `key` alone.

Practical risk: once you introduce multiple stores, admin/storefront sync can “work” while silently reading/writing across tenants.

---

## 6) Cardcom real integration status (verified in code)

### What is real
- Cardcom API call implementation exists: `src/lib/payment/cardcom.ts`
- Initiation endpoint exists: `src/app/api/payment/initiate/route.ts`
- Webhook callback exists: `src/app/api/webhooks/payment/route.ts`
  - Marks Order as paid/failed and triggers notifications/automations.

### What blocks it in production
- `process.env.CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_USERNAME`, `CARDCOM_API_PASSWORD` are required at runtime (non-null asserted with `!`).
- Admin-saved Cardcom Settings are not used by runtime.

Conclusion: Cardcom integration is “implemented in code,” but “operational in production” cannot be guaranteed from code alone and requires env vars.

---

## 7) Image/gallery real persistence status (verified in code)

### What is real
- Product images persist in MongoDB as `Product.images[]` and are used by `/product` when present.

### What is partial / risky
- Cloudinary upload endpoint exists and returns 503 with a clear message if env vars missing (`src/app/api/admin/upload/route.ts`).
- The admin UI lets you upload images and saves `images[]` into Product on save (`src/components/admin/ProductForm.tsx`).

Production requirement: Cloudinary env vars must be present for uploads to work. Otherwise only local `/public/images/*` URLs are usable.

---

## 8) Bundle engine status (verified in code)

- Bundle schema is real and persisted: `Product.bundles[]` (see `src/lib/db/models/Product.ts`).
- Storefront bundle selection is driven by bundles passed from server: `src/app/product/ProductClient.tsx`.
- Cart item uses `productId` + `variantLabel=bundle.title`, and stores bundle price into cart (`sellingPrice: bundle.price`).

Note: order pricing uses product base sellingPrice (not bundle price). The Orders API currently prices by `product.pricing.sellingPrice` for each unit item, and uses `item.quantity` from cart. The cart adds quantity=1 and sets `sellingPrice=bundle.price`.

This is a critical consistency point to verify:
- If checkout sends `items: [{ productId, quantity, ...}]` and quantity stays `1`, Orders API charges base product price (1×) rather than bundle price.
- The checkout page sends `items.map(i => ({ productId: i.productId, ... quantity: i.quantity }))` from the cart store, so the charged amount depends on what `quantity` is in cart for the bundle selection.

This repo needs a single canonical interpretation for “bundle purchase”:
- Either represent bundles as `{ productId, bundleId, quantity }` and compute totals server-side from bundle.price, **or**
- represent bundle as multiple units at base price and store “free units”/discount separately.

From the inspected code, bundles are used for display + cart price, but the Orders API re-prices by base product sellingPrice. That implies potential mismatch between displayed bundle price and charged amount unless cart quantity/logic matches the intended pricing model.

---

## 9) Missing production blockers (verified from env usage)

Hard blockers (app cannot function correctly without them):
- `MONGODB_URI` is required; `connectDB()` throws if missing: `src/lib/db/mongoose.ts`.

Operational blockers (features exist but do nothing without env vars):
- Cardcom: `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_USERNAME`, `CARDCOM_API_PASSWORD`
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (some code assumes gmail “service”, others use host/port)
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, plus `ADMIN_WHATSAPP_NUMBER` for admin notifications
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Cron publish: `CRON_SECRET` (required to call `/api/cron/publish-scheduled`)
- NextAuth: `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` affects callback URLs and Cardcom baseUrl fallback
- AliExpress import: `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET`

Not verifiable from codebase:
- Whether these env vars are set in Vercel right now.
- Whether MongoDB is Atlas vs localhost in production.

---

## 10) Exact Sprint 5 recommendation (based on verified gaps)

Sprint 5 should not start on “AI store generation” until the platform has a truthful, operational production core with no misleading admin configuration.

### Sprint 5 goal (recommended): “Make integrations real + remove fake storefront”

1. **Wire Settings → runtime credentials (or remove credential UIs).**
   - Decide one source of truth:
     - Option A (recommended for this repo): keep env vars as the only secret source, and update admin UIs to be “status only” (read-only) with clear “set in Vercel” instructions.
     - Option B: store encrypted credentials in MongoDB Settings and update Cloudinary/Twilio/SMTP/Cardcom code paths to read from Settings at runtime. (This requires encryption-at-rest, rotation, and careful access control.)

2. **Fix bundle pricing correctness end-to-end.**
   - Make Orders API price from the selected bundle (bundle price + quantity), not from base product price.
   - Add a server-validated representation of bundle selection in checkout payload.

3. **Remove storefront homepage hardcoding.**
   - Replace `/` hardcoded constants and reviews with DB-backed data (either render the product funnel from Product/PageLayout, or redirect `/` → `/product`).

4. **Finish multi-store isolation consistently (even if only “default” store exists today).**
   - Enforce `storeId` filters in:
     - Settings (including unique index on `{ storeId, key }`)
     - PageLayout reads/writes
     - Product reads/writes
   - Add a single `resolveStoreId()` mechanism (middleware/header) before expanding features.

5. **Replace serverless-unsafe delayed automation scheduling.**
   - Introduce a persistent scheduler (Vercel Cron hitting an endpoint that calls `processPendingScheduled()`), or a queue.
   - Remove `setTimeout` as “delivery mechanism.”

If you want Sprint 5 to match your existing Sprint 5 plan (AliExpress → AI → store generator), do it only after items 1–3 above are complete; otherwise you will generate stores that look configured but cannot actually process payments, send messages, or reliably price bundles.

