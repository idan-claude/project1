# REALITY VERIFICATION REPORT — Phase 0
**Date:** 2026-06-12  
**Status:** COMPLETE — All critical bugs fixed

---

## FLOWS AUDITED

### ✅ Register Flow (`/register`)
- Multi-step wizard: Account → Store Name → Category → Create
- Calls `POST /api/admin/auth/register`
- Rate-limited: 5 registrations/hour/IP
- Creates: `AdminUser` + `Store` + `StoreMember` (owner)
- Issues signed JWT cookie → redirects to `/admin/onboarding`
- **FIXED:** Input fields were `text-sm` (iOS zoom) → now `text-base`
- **FIXED:** "FC" logo replaced with store icon SVG

### ✅ Login Flow (`/admin/login`)
- DB-backed auth (AdminUser + bcrypt) with ENV fallback
- Rate-limited: 10 attempts/15min/IP
- Finds first active `StoreMember` to determine `storeId` + `role`
- Writes `admin_token` JWT cookie (7 days)
- Audit log on every attempt
- **FIXED:** Input fields were `text-sm` → now `text-base`
- **FIXED:** "FC" logo replaced with store icon SVG

### ✅ Forgot Password Flow (`/admin/forgot-password`)
- **CRITICAL BUG FIXED:** Middleware was blocking `/admin/forgot-password` (required auth cookie)
- Now excluded from auth check alongside `/admin/login` and `/admin/reset-password`
- Calls `POST /api/admin/auth/forgot-password`
- Rate-limited, sends reset link, dev mode exposes reset URL
- **FIXED:** Input was `text-sm` → now `text-base`
- **FIXED:** Logo cleaned up

### ✅ Reset Password Flow (`/admin/reset-password`)
- **CRITICAL BUG FIXED:** Same middleware issue — now excluded from auth check
- Calls `POST /api/admin/auth/reset-password`
- Validates token expiry, bcrypt hashes new password, clears token
- **FIXED:** Inputs were `text-sm` → now `text-base`
- **FIXED:** Logo cleaned up

### ✅ Create Store (`/admin/stores`)
- Lists all stores via `GET /api/admin/stores` (scoped to user memberships)
- Create new store: `POST /api/admin/stores/create` → new JWT with new storeId
- Switch store: `POST /api/admin/stores/switch` → validates membership, new JWT
- UI shows store status, plan, creation date
- **FIXED:** Create form input was `text-sm` → now `text-base`

### ✅ Store Editor (`/admin/storefront/editor`)
- Full design tokens, section content editing
- Drag-and-drop section reorder (HTML5 native, no deps)
- Checkout trust tab (6 trust toggles + text fields)
- Version history tab (list + restore)
- Publish action creates `StoreThemeVersion` snapshot
- Live storeId scoping via JWT

### ✅ Version History (`/api/admin/storefront/versions`)
- `GET`: lists up to 50 published versions for current storeId
- `POST {versionId}`: restores snapshot to draft (excludes `_id/__v/createdAt/updatedAt/storeId`)
- Correctly scoped by storeId

### ✅ Integrations / Pixels
- Meta Pixel: wizard flow (intro → pixel → capi → test → done)
- TikTok Pixel: similar setup flow at `/admin/marketing/tiktok`
- Credentials stored encrypted in Settings model keyed by `integration:{service}`
- Test event capability at `POST /api/admin/integrations/meta/test`
- Proper masking of secrets in GET responses

### ✅ Payments (`/admin/payments`)
- Transactions tab (filter by status)
- Providers tab (enable/disable/reorder multiple providers)
- Cardcom connection tab (terminal/username/password + test button)
- Health check via `GET /api/admin/payment-settings/health`
- All operations scoped to storeId

### ✅ Onboarding (`/admin/onboarding`)
- Loads readiness data from `GET /api/admin/readiness`
- 8 weighted checks across 4 categories (brand, product, sales, comms)
- Dynamic step completion based on real DB state
- "Skip" available for all optional steps

### ✅ Multi-Store Tenant Isolation
- Every API route uses `getAdminPayload(req)?.storeId` from JWT
- Store switch rewrites JWT cookie with new storeId
- StoreMember.findOne verifies membership before switch
- Legacy users fallback to `storeId: 'default'`

### ✅ Mobile Excellence
- All form inputs across auth/account flows: `text-base` (16px, prevents iOS zoom)
- Cart drawer tap targets: 44px minimum
- Hamburger: 44px minimum
- Footer social icons: 44px
- Hero padding/heading responsive

---

## BUGS FOUND & FIXED

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | 🔴 CRITICAL | `/admin/forgot-password` blocked by middleware — unauthenticated users redirected to login | Added to `ADMIN_PUBLIC` exclusion list in `middleware.ts` |
| 2 | 🔴 CRITICAL | `/admin/reset-password` blocked by middleware — same issue | Added to `ADMIN_PUBLIC` exclusion list |
| 3 | 🟠 HIGH | iOS zoom on login inputs (`text-sm`) | Changed to `text-base` |
| 4 | 🟠 HIGH | iOS zoom on forgot-password input | Changed to `text-base` |
| 5 | 🟠 HIGH | iOS zoom on reset-password inputs | Changed to `text-base` |
| 6 | 🟠 HIGH | iOS zoom on register page inputs | Changed to `text-base` |
| 7 | 🟠 HIGH | iOS zoom on stores create form input | Changed to `text-base` |
| 8 | 🟡 MEDIUM | "Vercel" mentioned in domain settings tab (technical jargon) | Replaced with "פנה לתמיכה שלנו" |
| 9 | 🟡 MEDIUM | "FindCard Admin" hardcoded in AdminShell mobile header | Replaced with "ניהול חנות" + store icon |
| 10 | 🟡 MEDIUM | "FindCard" hardcoded in AdminSidebar logo | Replaced with "ניהול חנות" + store icon |
| 11 | 🟡 MEDIUM | "FC" abbreviation logo in auth pages | Replaced with store SVG icon |

---

## REMAINING TECHNICAL DEBT

These items are NOT blocking but require attention in later phases:

- **Phase 3 — Merchant Mode**: Storefront pages (`/product`, `/contact`, policies) still contain "FindCard" brand content — these are merchant-specific content, not platform UI
- **Phase 3**: `credentials.ts` has `fromName: 'FindCard'` in SMTP fallback — emails sent from ENV-based SMTP will say "FindCard"
- **Phase 3**: Settings default `storeName: 'FindCard'` — cosmetic default value
- **Phase 9**: Versioning restore doesn't yet handle `StoreThemeVersion.snapshot` fields that were added AFTER the snapshot was taken (merge strategy)
- **Phase 10**: Mobile testing not verified on physical devices — code analysis only
- **Phase 11**: Onboarding readiness check for "SMTP" check exposes `process.env.SMTP_USER` in label text (minor)

---

## FLOW DIAGRAMS

### Auth Flow (Fixed)
```
Merchant → /register → [4-step wizard] → /api/admin/auth/register → admin_token cookie → /admin/onboarding
Merchant → /admin/login → /api/admin/auth/login → admin_token cookie → /admin
Merchant → /admin/login → "שכחתי סיסמה" → /admin/forgot-password ✅ (NO LONGER BLOCKED)
         → /api/admin/auth/forgot-password → email with token
         → /admin/reset-password?token=xxx ✅ (NO LONGER BLOCKED)
         → /api/admin/auth/reset-password → password updated → /admin/login
```

### Multi-Store Flow
```
Merchant logs in → JWT contains storeId A
All API routes: getAdminPayload(req)?.storeId → filters DB queries to storeId A
Merchant visits /admin/stores → sees all stores (A, B, C)
Merchant clicks "הפעל" on store B → POST /api/admin/stores/switch?storeId=B
→ validates StoreMember → issues new JWT with storeId B → redirect /admin
All subsequent queries now scoped to storeId B ✅
```

---

## PHASE 0 VERDICT: PASS ✅

All critical user flows work correctly after fixes.  
Platform is ready to proceed to Phase 1 (Multi-Store Hardening).
