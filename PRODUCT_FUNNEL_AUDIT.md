# PRODUCT_FUNNEL_AUDIT.md
Last updated: 2026-05-25

## What the Storefront Has (Every Visible Element)

| Section | Element | Admin Controlled? | Notes |
|---------|---------|-------------------|-------|
| Header | Product name (H1) | ✅ `nameHe` | DB field |
| Header | Stock badge (במלאי / אזל המלאי) | ✅ `inventory.quantity` | Live from DB |
| Header | Star rating display | ✅ `pageContent.reviewRating` | Admin-set or auto-calculated |
| Header | Review count | ✅ `pageContent.reviewCount` | Admin-set or auto-calculated |
| Gallery | Product images | ✅ `images[]` | DB array, ordered |
| Gallery | Thumbnail strip | ✅ (same images[]) | First is primary |
| Bundle selector | Bundle titles | ✅ `bundles[].title` | Per-bundle DB field |
| Bundle selector | Bundle quantities | ✅ `bundles[].quantity` | Per-bundle DB field |
| Bundle selector | Bundle prices | ✅ `bundles[].price` | Exact agorot, no rounding |
| Bundle selector | Bundle compare-at prices | ✅ `bundles[].compareAtPrice` | Exact agorot |
| Bundle selector | Bundle badges ("72% מהלקוחות") | ✅ `bundles[].badge` | Per-bundle text |
| Bundle selector | Badge color | ✅ `bundles[].badgeColor` | Tailwind class |
| Bundle selector | Recommended toggle | ✅ `bundles[].isRecommended` | Controls default selection |
| Bundle selector | Benefit lines | ✅ `bundles[].benefits[]` | Shown under bundle title |
| Bundle selector | Discount % | ✅ (calculated from price/compareAt) | Auto |
| Urgency bar | "מבצע מוגבל" text | ✅ `pageContent.urgencyText` | Defaults if empty |
| Price display | Sale price | ✅ `bundles[].price` | |
| Price display | Compare-at / strikethrough | ✅ `bundles[].compareAtPrice` | |
| Price display | "חסכת ₪X" | ✅ (auto-calculated) | |
| CTA buttons | "קנה עכשיו" / "הוסף לסל" | ⚠️ Text hardcoded | A/B testing future |
| Trust strip (mobile) | Icons + text | ✅ `pageContent.trustBadges[]` | Defaults if empty |
| Delivery box | Shipping text | ✅ `pageContent.shippingText` | Defaults if empty |
| Guarantee box | Guarantee text | ✅ `pageContent.guaranteeText` | Defaults if empty |
| Trust badges (desktop) | Icon + label | ✅ `pageContent.trustBadges[]` | Defaults if empty |
| Review carousel | Review text | ✅ `Review` model (approved) | Falls back to samples |
| Review carousel | Reviewer name | ✅ `Review.customer.name` | |
| Review carousel | Star rating | ✅ `Review.rating` | |
| Features section | 6 feature icons | ✅ `pageContent.features[]` | Defaults if empty |
| Features section | Feature labels | ✅ `pageContent.features[].label` | |
| Features section | Feature descriptions | ✅ `pageContent.features[].desc` | |
| Reviews grid | All review fields | ✅ `Review` model (approved) | Falls back to samples |
| Reviews grid | Rating aggregate | ✅ `pageContent.reviewRating` | |
| Reviews grid | Review count label | ✅ `pageContent.reviewCount` | |
| FAQ section | Questions | ✅ `pageContent.faqs[].q` | Defaults if empty |
| FAQ section | Answers | ✅ `pageContent.faqs[].a` | Defaults if empty |
| Sticky bar (mobile) | Bundle name + price | ✅ (from selected bundle) | |

---

## What Was Missing (Before This Sprint)

| Element | Status Before | Fix Applied |
|---------|--------------|-------------|
| Bundle prices | ❌ Hardcoded formula (×1.5, ×1.9) with `roundTo10` rounding to nearest ₪10 | ✅ Admin sets exact prices. No rounding. |
| Bundle titles | ❌ Hardcoded ("2 כרטיסים + 1 חינם") | ✅ Per-bundle `title` field in DB |
| Bundle quantities | ❌ Hardcoded (1, 3, 4) | ✅ Per-bundle `quantity` field in DB |
| Bundle badges | ❌ Hardcoded ("72% מהלקוחות", "הכי משתלם!") | ✅ Per-bundle `badge` + `badgeColor` fields |
| Bundle recommended | ❌ Always defaulted to index 1 | ✅ `isRecommended` toggle per bundle |
| Bundle benefits | ❌ Nonexistent | ✅ `benefits[]` array per bundle |
| Bundle image override | ❌ Nonexistent | ✅ `imageOverride` per bundle |
| Urgency text | ❌ Hardcoded "מבצע מוגבל: 24 שעות אחרונות..." | ✅ `pageContent.urgencyText` |
| Shipping text | ❌ Hardcoded "מגיע תוך 7–14 ימי עסקים..." | ✅ `pageContent.shippingText` |
| Guarantee text | ❌ Hardcoded "אחריות לכל החיים + 100 יום..." | ✅ `pageContent.guaranteeText` |
| Trust badges | ❌ Hardcoded (3 fixed icons) | ✅ `pageContent.trustBadges[]` |
| Features section | ❌ Hardcoded 6 items | ✅ `pageContent.features[]` |
| FAQ section | ❌ Hardcoded 6 questions | ✅ `pageContent.faqs[]` |
| Review carousel | ❌ Hardcoded fake reviews | ✅ Reads from `Review` model (approved), samples as fallback |
| Reviews grid | ❌ Hardcoded fake reviews | ✅ Same — live DB reviews |
| Review stats | ❌ Hardcoded "4.9 · 312 ביקורות" | ✅ Admin-set or auto-calculated from DB |
| Pricing presets | ❌ No tools for .90/.99 endings | ✅ x90/x99/round preset buttons in admin |

---

## What Still Has Hardcoded Elements

| Element | Reason | Plan |
|---------|--------|------|
| CTA button text ("קנה עכשיו ←") | Intentional — tied to buy flow logic | A/B testing system (Sprint 4) |
| "הצטרף לאלפי לקוחות מרוצים..." bottom CTA | Cosmetic text | Low priority — add to `pageContent` |
| Breadcrumb ("בית › FindCard PRO") | Uses `nameHe` for product name ✅ | |
| 100 ימי החזר כסף (inside guarantee box) | Covered by `guaranteeText` ✅ | |

---

## Pricing Regression Fix

**Before:**
```typescript
function roundTo10(n: number): number {
  return Math.round(n / 1000) * 1000  // rounds to nearest ₪10
}
buildTiers(19990, 29990) → prices: ₪199.90, ₪300, ₪380  ← WRONG
```

**After:**
- No `roundTo10` anywhere in codebase
- Bundles stored with exact agorot values in MongoDB
- Default bundles (when none set) use `psychoPrice()` for ×.90 endings:
  ```typescript
  psychoPrice(29985) → 29990 → ₪299.90 ✓
  psychoPrice(37981) → 37990 → ₪379.90 ✓
  ```
- Admin pricing presets: `.90` snap, `.99` snap, `round`
- `priceDisplay(19990)` → ₪199.90 ✓ (no integer truncation)

---

## Admin Controls Map (ProductForm tabs)

| Tab | Controls |
|-----|----------|
| פרטים | שם עברית/אנגלית, תיאור, SKU, סטטוס, מוצג בדף הבית |
| תמונות | גלריה, העלאה, גרירה לסידור, מחיקה |
| **חבילות (NEW)** | כותרת, כמות, מחיר מדויק, מחיר מחוק, badge, צבע, מומלץ toggle, יתרונות, תמונה override, פעיל/כבוי |
| מחיר ומלאי | מחיר בסיס + פרסטים (.90/.99/עגול), מחיר מחוק + פרסטים, עלות, מלאי |
| **תוכן עמוד (NEW)** | טקסט דחיפות, טקסט משלוח, טקסט אחריות, סטטיסטיקות ביקורות, אייקוני אמון, מאפיינים (features), FAQ |
| SEO | meta title, meta description |
| משלוח | משקל, משלוח חינם, דורש משלוח |

---

## Architecture: Admin → Storefront Data Flow

```
Admin saves product (ProductForm)
  → PUT /api/admin/products/[id]
  → Product.findByIdAndUpdate() in MongoDB
       ↓
Next request to /product
  → Server component (page.tsx, dynamic)
  → Product.findOne({ slug, status: 'active' }).lean()
  → Review.find({ status: 'approved' }).limit(20)
       ↓
ProductClient receives:
  { productId, slug, nameHe, gallery, bundles, inStock, pageContent, reviews }
       ↓
HTML rendered with LIVE data — no cache, no fallback to stale state
```

**Every admin change is live on the next page load. No deployment required.**

---

## A/B Testing Infrastructure (Sprint 4 Candidate)

The product model is ready to support experiments. The next step is:
1. Add `experiments[]` field to Product model
2. Assign variant in server component (hash of session/IP)
3. Track variant exposure via VisitorEvent
4. Admin UI to create/activate experiments
5. Analysis: conversion rate per variant

Currently: all users see the same page. Infrastructure for split testing is designed but not activated.
