# Admin–Storefront Sync Audit
**Date:** 2026-06-12  
**Scope:** Every admin-editable field → storefront rendering verification

---

## EXECUTIVE SUMMARY

7 sync gaps found. 3 are critical (admin saves data but storefront shows hardcoded values). 2 are high (admin fields exist but storefront never renders them). 2 are medium (feature partially working).

---

## SECTION 1: STOREFRONT EDITOR (StoreTheme model)

### 1A. Header Config
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Announcement enabled | Storefront Editor → כותרת | `Header.tsx` line 93 | ✅ WORKS |
| Announcement text | Storefront Editor → כותרת | `Header.tsx` line 98 | ✅ WORKS |
| Announcement bg color | Storefront Editor → כותרת | `Header.tsx` line 95 | ✅ WORKS |
| Sticky header | Storefront Editor → כותרת | `Header.tsx` line 91 | ✅ WORKS |
| CTA button enabled | Storefront Editor → כותרת | `Header.tsx` line 152 | ✅ WORKS |
| CTA button text | Storefront Editor → כותרת | `Header.tsx` line 160 | ✅ WORKS |
| Phone (בכותרת) | Storefront Editor → כותרת | `Header.tsx` — received but **never rendered** | ❌ BROKEN |
| WhatsApp (בכותרת) | Storefront Editor → כותרת | `Header.tsx` — received but **never rendered** | ❌ BROKEN |

**Fix required:** Render `config.phone` and `config.whatsapp` in Header when set.

### 1B. Footer Config
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Tagline | Storefront Editor → פוטר | `Footer.tsx` line 27 | ✅ WORKS |
| Instagram URL | Storefront Editor → פוטר | `Footer.tsx` line 44 | ✅ WORKS |
| TikTok URL | Storefront Editor → פוטר | `Footer.tsx` line 53 | ✅ WORKS |
| WhatsApp URL | Storefront Editor → פוטר | `Footer.tsx` line 62 | ✅ WORKS |
| Facebook URL | Storefront Editor → פוטר | `Footer.tsx` line 70 | ✅ WORKS |
| Contact email | Storefront Editor → פוטר | `Footer.tsx` line 120 | ✅ WORKS |
| Contact phone | Storefront Editor → פוטר | `Footer.tsx` line 127 | ✅ WORKS |
| Copyright | Storefront Editor → פוטר | `Footer.tsx` line 29 | ✅ WORKS |
| Show payment icons | Storefront Editor → פוטר | `Footer.tsx` (toggle) | ✅ WORKS |
| Show trust badges | Storefront Editor → פוטר | `Footer.tsx` line 108 | ✅ WORKS |

### 1C. Checkout Config
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Show SSL badge | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 395 | ✅ WORKS |
| Show guarantee badge | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 404 | ✅ WORKS |
| Show return badge | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 410 | ✅ WORKS |
| Show shipping badge | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 416 | ✅ WORKS |
| Show payment icons | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 316 | ✅ WORKS |
| Security text | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 211 | ✅ WORKS |
| Guarantee text | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 407 | ✅ WORKS |
| Return text | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 413 | ✅ WORKS |
| Shipping text | Storefront Editor → צ'קאאוט | `CheckoutClient.tsx` line 419 | ✅ WORKS |

### 1D. Brand Assets
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Logo URL | Storefront Editor → מיתוג | `Header.tsx` line 113, `Footer.tsx` preview | ✅ WORKS |
| Favicon URL | Storefront Editor → מיתוג | Root `layout.tsx` — **static metadata, never applied** | ❌ BROKEN |
| Hero image URL | Storefront Editor → מיתוג | No storefront component reads this field | ❌ BROKEN |

**Fix required:** Apply `faviconUrl` to root layout `<head>`.

### 1E. Design Tokens
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Primary color | Storefront Editor → צבעים | Editor live preview only — **not applied to actual storefront** | ⚠️ PREVIEW ONLY |
| Secondary color | Storefront Editor → צבעים | Editor live preview only | ⚠️ PREVIEW ONLY |
| Accent color | Storefront Editor → צבעים | Editor live preview only | ⚠️ PREVIEW ONLY |
| Background color | Storefront Editor → צבעים | Editor live preview only | ⚠️ PREVIEW ONLY |
| Font family | Storefront Editor → גופן | Editor live preview only | ⚠️ PREVIEW ONLY |
| Button radius | Storefront Editor → מבנה | Editor live preview only | ⚠️ PREVIEW ONLY |
| Card radius | Storefront Editor → מבנה | Editor live preview only | ⚠️ PREVIEW ONLY |

**Note:** All design tokens appear in the live preview but do NOT affect the real storefront. This is expected complexity (requires CSS variable injection). Documented here for future phase.

### 1F. Sections (Enable/Disable)
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Section enabled toggles | Storefront Editor → סקציות | `HomePageClient.tsx` — sections always rendered, enabled flag never checked | ⚠️ PARTIAL |
| Hero content (headline, etc.) | Storefront Editor → סקציות → כותרת ראשית | `HomePageClient.tsx` via content prop | ✅ WORKS |
| Benefits items | Storefront Editor → סקציות → יתרונות | `HomePageClient.tsx` via content prop | ✅ WORKS |
| Guarantee headline/body | Storefront Editor → סקציות → אחריות | `HomePageClient.tsx` via content prop | ✅ WORKS |
| CTA content | Storefront Editor → סקציות → קריאה לפעולה | `HomePageClient.tsx` via content prop | ✅ WORKS |

---

## SECTION 2: ADMIN SETTINGS (Settings model)

### 2A. Store Info Tab
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Store name | Settings → פרטי חנות | Storefront reads `Store.name` (different model) — **Settings.storeName is never read** | ❌ BROKEN |
| Support email | Settings → פרטי חנות | Not shown on storefront (only used for notifications) | ⚠️ NOT SURFACED |
| Phone | Settings → פרטי חנות | Not shown on storefront | ⚠️ NOT SURFACED |
| Address/City | Settings → פרטי חנות | Not shown on storefront | ⚠️ NOT SURFACED |

**Fix required:** When saving `key='store'`, also update `Store.name` so storefront reflects the change.

### 2B. FAQ Tab
| Admin Field | Admin Path | Storefront Component | Status |
|-------------|-----------|---------------------|--------|
| Global FAQs | Settings → שאלות נפוצות | Product page reads from `Settings.global_faqs` | ✅ WORKS |
|  |  | Homepage fetches from `/api/faq` | ✅ WORKS |

---

## SECTION 3: HARDCODED VALUES IN STOREFRONT

These values are hardcoded in code and cannot be changed from any admin panel:

| Hardcoded Value | File | Location | Fix |
|----------------|------|----------|-----|
| `WA_NUMBER = '9720525884463'` | `WhatsAppBubble.tsx` | Line 4 | Read from `StoreTheme.headerConfig.whatsapp` |
| `WA_NUMBER = '9720525884463'` | `CheckoutClient.tsx` | Line 11 | Read from `headerConfig.whatsapp` |
| `title: 'FindCard - כרטיס המעקב החכם'` | `layout.tsx` | Root metadata | Dynamic via `generateMetadata()` |
| `storeName = 'FindCard'` | Multiple pages | Default fallback | OK as fallback, fix Settings→Store.name sync |

---

## SECTION 4: MULTI-STORE VERIFICATION

- `storeId` is read from `process.env.STORE_ID || 'default'` in storefront pages
- Admin uses JWT `payload.storeId` for auth
- Risk: `api/admin/settings/route.ts` reads `storeId` from **request body** (not JWT) — a malicious request could target another store's settings
- Fix: Read storeId from JWT payload (like `storefront/theme/route.ts` does)

---

## PRIORITY FIX LIST

| Priority | Issue | Files | Complexity |
|----------|-------|-------|------------|
| 1 | WA_NUMBER hardcoded in WhatsAppBubble | `WhatsAppBubble.tsx`, `layout.tsx` | Low |
| 2 | WA_NUMBER hardcoded in CheckoutClient | `CheckoutClient.tsx` | Low |
| 3 | Header phone/whatsapp not rendered | `Header.tsx` | Low |
| 4 | faviconUrl not applied | `layout.tsx` | Low |
| 5 | Admin storeName doesn't sync to Store.name | `api/admin/settings/route.ts` | Low |
| 6 | Section enabled flags not honored | `HomePageClient.tsx`, `page.tsx` | Medium |
| 7 | heroImageUrl unused | `HomePageClient.tsx` | Medium |
| 8 | Design tokens not applied | Multiple components | High |
| 9 | api/admin/settings uses body storeId | `api/admin/settings/route.ts` | Low |

---

## STATUS: FIXES IMPLEMENTATION IN PROGRESS
