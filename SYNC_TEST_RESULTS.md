# SYNC_TEST_RESULTS.md
Last tested: 2026-05-25

## Architecture: Single Source of Truth

MongoDB is the only data store. Admin writes → MongoDB. Storefront reads → MongoDB. No cache. No local state. No seeded fallbacks.

**Product ID in DB:** `6a142c675b7b11326a4c2bcf`
**Test endpoint:** `GET /api/products/kartis-maakav-smart-pro`
**Admin update endpoint:** `PUT /api/admin/products/[id]`
**DB:** MongoDB Atlas — `mongodb+srv://...cluster0.yqlgyap.mongodb.net/tracker-store`

---

## Test Results (2026-05-25 16:31 IDT)

| Test | Change | Before | After (storefront API) | Result |
|------|--------|--------|----------------------|--------|
| 1. Title | Admin PUT nameHe | `כרטיס מעקב FindCard PRO` | `SYNC_TEST_TITLE_001` | ✅ PASS |
| 2. Price | Admin PUT pricing.sellingPrice | `19990` (₪199.90) | `14900` (₪149.00) | ✅ PASS |
| 3. Add image | Admin PUT images (1→4) | 1 image | 4 images | ✅ PASS |
| 4. Remove image | Admin PUT images (4→2) | 4 images | 2 images | ✅ PASS |
| 5. Inventory | Admin PUT inventory.quantity (1500→0) | `1500` | `0` | ✅ PASS |

All changes reflected **immediately** (< 1 second latency) via next request to storefront API. No stale cache.

---

## Restore State (verified after all tests)

After running all tests, product was restored to correct production state:

```
nameHe:          כרטיס מעקב FindCard PRO
sellingPrice:    19990 (₪199.90)
compareAtPrice:  29990
images:          4 total
  [0] /images/product-1-hero.svg     (FindCard PRO — תצוגה ראשית)
  [1] /images/product-2-wallet.svg   (FindCard PRO — בארנק)
  [2] /images/product-3-bundle.svg   (FindCard PRO — חבילות)
  [3] /images/product-4-features.svg (FindCard PRO — מאפיינים)
inventory.quantity: 1500
status:          active
```

---

## Image Bug — Root Cause & Fix

**Root cause:** DB had only 1 image (seeded during Sprint 1). Product page fell back to 4 static `GALLERY` SVGs but only pushed the 1 DB image to state.

**Fix applied:**
1. All 4 product images added to MongoDB via admin API
2. Product page state `gallery` now initialized from DB on mount
3. `if (p.images?.length) setGallery(p.images.map(img => img.url))` — if DB has images, use them; if none, fallback to static GALLERY

**Result:** Storefront now shows all 4 images from MongoDB. Admin can add/remove/reorder via product form.

---

## How Sync Works

```
Admin saves product → PUT /api/admin/products/[id] → Product.findByIdAndUpdate(id, body)
                                                               ↓
                                                         MongoDB Atlas
                                                               ↓
Storefront loads → useEffect fetch /api/products/slug → Product.findOne({ slug, status:'active' })
                                                               ↓
                                                     Sets: productId, productName,
                                                           tiers (from sellingPrice),
                                                           gallery (from images[]),
                                                           inStock (inventory.quantity > 0)
```

No intermediate cache. No static generation. `export const dynamic = 'force-dynamic'` on both APIs.

---

## Tier Pricing Logic

Tiers are calculated from DB `pricing.sellingPrice`:

```
basePrice = product.pricing.sellingPrice  (e.g. 19990 = ₪199.90)
compareAtPrice = product.pricing.compareAtPrice (e.g. 29990)

Tier 0 (1 card):  price = basePrice        | compareAt = compareAtPrice
Tier 1 (3 cards): price = round(base×1.5)  | compareAt = 3 × basePrice  
Tier 2 (4 cards): price = round(base×1.9)  | compareAt = 4 × basePrice  
```

`roundTo10` rounds to nearest ₪10 (1000 agorot) — all prices are clean integers.

**Admin changes `sellingPrice` → all tier prices update automatically on next page load.**

---

## What Was Fixed in Sprint 3

1. `productId` in cart: Was slug string `'kartis-maakav-smart-pro'` → Now real MongoDB `_id` `'6a142c675b7b11326a4c2bcf'`
2. Orders API: `Product.findById(slug)` crashed → Added `.catch(() => null) || findOne({ slug })` fallback
3. Gallery: Was hardcoded 4 SVGs → Now reads from `product.images[]` in MongoDB
4. Prices: Were hardcoded → Now derived from `product.pricing.sellingPrice`
5. Stock status: Was always "במלאי" → Now reads `inventory.quantity > 0`
6. Product name in cart: Was hardcoded → Now from `product.nameHe`
