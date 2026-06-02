# SaaS Sprint 3 — Pre-check Report
**Date:** 2026-06-02

## Foundation Status

| Component | Status | Location |
|-----------|--------|----------|
| `AdminUser` model | ✅ READY | `src/lib/db/models/AdminUser.ts` |
| `Store` model | ✅ READY | `src/lib/db/models/Store.ts` |
| `StoreMember` model | ✅ READY | `src/lib/db/models/StoreMember.ts` |
| `Settings` model (encrypted) | ✅ READY | `src/lib/db/models/Settings.ts` |
| `PageLayout` model | ✅ READY | `src/lib/db/models/PageLayout.ts` |
| `getStoreId()` context engine | ✅ READY | `src/lib/tenant/middleware.ts` |
| `encrypt/decrypt` (AES-256-GCM) | ✅ READY | `src/lib/settings/encrypt.ts` |
| `credentials.ts` (DB-first, ENV fallback) | ✅ READY | `src/lib/settings/credentials.ts` |
| `page-builder/types.ts` (Block JSON model) | ✅ READY | `src/lib/page-builder/types.ts` |
| Admin auth JWT (storeId in payload) | ✅ READY | `src/lib/auth/adminAuth.ts` |
| Registration API | ✅ READY | `src/app/api/admin/auth/register/route.ts` |
| Admin register page (3-step wizard) | ✅ READY | `src/app/admin/register/page.tsx` |
| Admin onboarding page | ✅ READY | `src/app/admin/onboarding/page.tsx` |
| Store list API | ✅ READY | `src/app/api/admin/stores/route.ts` |

## Gaps Requiring Sprint 3 Work

| Gap | Priority | Phase |
|-----|----------|-------|
| Public `/register` page (not under /admin) | HIGH | 1 |
| `/admin/stores` multi-store management | HIGH | 3 |
| Store switcher in admin sidebar | HIGH | 3 |
| `StoreTheme` model (design tokens) | HIGH | 7 |
| `/admin/storefront/editor` design editor | HIGH | 5 |
| AI builder API + UI | MEDIUM | 10 |
| `TENANT_ISOLATION_REPORT.md` | MEDIUM | 4 |
| Readiness score system | MEDIUM | 13 |
| Store creation w/ default theme/pages | HIGH | 2 |

## Existing Store (Store #1 — FindCard)

- All products, orders, analytics continue to operate under `storeId: 'default'`
- `scripts/migrate-saas-v1.ts` seeds the default Store + AdminUser from ENV
- No data loss risk — existing data retains `storeId: 'default'`

## Sprint 3 Build Plan

Phases addressed in this sprint:
- Phase 0: ✅ This report
- Phase 1: Public registration + login
- Phase 2: Store creation flow (inside onboarding)
- Phase 3: Multi-store management + switcher
- Phase 4: Tenant isolation audit
- Phase 5: Store design editor
- Phase 7: Page JSON model (already exists in `page-builder/types.ts`)
- Phase 8: Preview system (live in editor)
- Phase 9: Publishing flow
- Phase 10: AI builder entry point
- Phase 13: Onboarding checklist
- Phase 16: Safety — no data loss to existing store
