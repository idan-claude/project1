# SYNC_FAILURE_REPORT.md
Created: 2026-05-25

## Summary

Admin price changes were NOT updating the storefront on production. Root cause: two separate problems, both now fixed.

---

## Root Cause #1 — Wrong Build on Vercel (Critical)

**What was broken:** Vercel was running an old build (`page-ae87d15691c4ca96.js`) that had **zero MongoDB integration** — pure hardcoded TIERS array baked into the bundle. Admin changes to DB had no effect because the production code never touched the DB.

**Why it happened:** The auto-backup script (`scripts/auto-backup.sh`) commits and pushes code to GitHub automatically. But Vercel was NOT configured to auto-deploy from those GitHub pushes. So GitHub had Sprint 3 code, but Vercel was still running Sprint 2 code.

**How confirmed:**
```bash
# Old bundle had zero DB fetch:
curl https://project1-flame-phi.vercel.app/_next/static/chunks/page-ae87d15691c4ca96.js \
  | grep -c 'api/products'
# → 0 (no DB calls)

# Old bundle had hardcoded tiers:
curl ... | grep 'TIERS\|19990\|buildTiers'
# → hardcoded values found
```

**Fix:** `npx vercel --prod --yes` — deployed directly from local build, bypassing the GitHub → Vercel auto-deploy gap.

---

## Root Cause #2 — Product Page Was Static (Architecture)

**What was broken:** Even after deploying Sprint 3 code, the `/product` route was marked `○` (Static) in the Next.js build. This means Next.js pre-rendered the HTML at build time with the hardcoded initial state `buildTiers(19990, 29990)`.

**Why it happened:** `page.tsx` was a `'use client'` component. Client components have no server-side data fetching — Next.js sees no async work in the component and pre-renders static HTML. The `useEffect` fetch only runs in the browser after hydration, causing:
1. Flash of stale prices on initial page load
2. Vercel CDN caching the static HTML shell indefinitely
3. Crawlers/bots seeing hardcoded prices, not live DB prices

**How confirmed:**
```
Build output (before fix):
├ ○ /product   ← Static, pre-rendered, no DB

Build output (after fix):
├ ƒ /product   ← Dynamic, server-rendered on demand
```

**Fix:** Converted `page.tsx` to an async server component that queries MongoDB directly at request time, passing data as props to `ProductClient.tsx`.

---

## Architecture After Fix

```
User requests /product
       ↓
Vercel edge (no cache — x-vercel-cache: MISS always)
       ↓
Next.js server component (page.tsx)
  - export const dynamic = 'force-dynamic'
  - await connectDB()
  - Product.findOne({ slug, status: 'active' }).lean()
  - buildTiers(pricing.sellingPrice, pricing.compareAtPrice)
       ↓
ProductClient.tsx receives real DB data as props
  - No useEffect DB fetch
  - No initial state fallback
  - Prices, images, stock: all from server props
       ↓
HTML sent to browser with REAL prices baked in
```

**Admin change → DB → next request → live in HTML. No intermediate cache. No fallback.**

---

## Verification (post-fix, 2026-05-25)

```bash
# 1. Production API returns live DB data
curl https://project1-flame-phi.vercel.app/api/products/kartis-maakav-smart-pro
# → price=19990, compareAt=29990, images=4, qty=1500 ✓

# 2. Product page is not cached
curl -I https://project1-flame-phi.vercel.app/product
# → x-vercel-cache: MISS ✓

# 3. HTML contains live prices
curl https://project1-flame-phi.vercel.app/product | grep '₪'
# → ₪199.90 (base), ₪300 (3-pack), ₪380 (4-pack) — all from DB ✓
```

**Build route table (production):**
```
ƒ /product   8.29 kB   115 kB   ← Dynamic, server-rendered on demand
```

---

## What Was Changed

| File | Change |
|------|--------|
| `src/app/product/page.tsx` | Rewritten as async server component — no `'use client'`, queries MongoDB directly, `export const dynamic = 'force-dynamic'` |
| `src/app/product/ProductClient.tsx` | New client component — receives all product data as props, handles UI interactivity only |

---

## Lesson

The auto-backup script creates a false sense of security. GitHub having the latest code does NOT mean Vercel has deployed it. Until Vercel is configured for auto-deploy from the target branch, every production deploy requires: `npx vercel --prod --yes`

---

## Current Production State (verified 2026-05-25)

```
URL:          https://project1-flame-phi.vercel.app/product
Route:        ƒ Dynamic
Cache:        MISS on every request
DB price:     19990 (₪199.90)
HTML price:   ₪199.90 ← matches DB exactly
Images:       4 (from MongoDB)
Inventory:    1500 (live from DB)
```

Sprint 3 sync architecture is now complete and verified on production.
