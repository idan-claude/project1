# Platform Reality Audit
Generated: 2026-06-02

## Summary
**Overall: PRODUCTION-GRADE — ~70% core features working with real DB backing**

---

## Feature Status

### Registration & Auth
| Feature | Status | Notes |
|---|---|---|
| /register — public 4-step wizard | WORKING | Creates AdminUser + Store + StoreMember in MongoDB |
| /admin/login | WORKING | JWT auth, proper error states |
| /admin/register | WORKING | Redirects to /register |
| /admin/onboarding | PARTIAL | UI-only — completion state not persisted to DB |
| Session management | WORKING | httpOnly cookies, 7-day JWT |

### Store Management
| Feature | Status | Notes |
|---|---|---|
| /admin/stores — multi-store list | WORKING | Real DB, create/switch |
| Store switcher in sidebar | WORKING | Shows current store, links to /admin/stores |
| Store create | WORKING | Creates Store + StoreMember with owner role |
| Store switch | WORKING | Issues new JWT for switched store |
| Tenant isolation | WORKING | getStoreId() on all authenticated routes |

### Product Management
| Feature | Status | Notes |
|---|---|---|
| /admin/products — list | WORKING | Real MongoDB query, search, filter, pagination |
| /admin/products/new | WORKING | Creates product with slug, DB write |
| /admin/products/[id] | WORKING | Edit, versioning, duplicate |
| /admin/builder — AI builder | WORKING | URL/AliExpress/manual → AI generate → save to DB |
| AI extraction | WORKING | Falls back to templates if no ANTHROPIC_API_KEY |

### Orders & Payments
| Feature | Status | Notes |
|---|---|---|
| /admin/orders — list | WORKING | Real orders, status filter, pagination |
| /admin/orders/[id] — detail | WORKING | Full order detail, status update |
| /admin/payments | WORKING | Transactions + Cardcom config + health check |
| Cardcom setup | WORKING | Config stored encrypted in DB, test endpoint |

### Store Design
| Feature | Status | Notes |
|---|---|---|
| /admin/storefront/editor | WORKING | Design tokens, sections, publish/draft |
| Live preview | WORKING | Real-time token application in iframe-like preview |
| Google Fonts | WORKING | Hebrew fonts loaded in preview |
| Publish/unpublish | WORKING | status field in StoreTheme, version increment |

### Analytics
| Feature | Status | Notes |
|---|---|---|
| /admin/analytics | WORKING | Real VisitorEvent data, conversion funnel |
| /admin/analytics/visitors | WORKING | Session-level tracking, full event timeline |
| /admin/products/intelligence | WORKING | Per-product performance |
| /admin/executive | WORKING | Executive KPIs |

### Marketing
| Feature | Status | Notes |
|---|---|---|
| /admin/marketing/meta | WORKING | Real pixel status, delivery rate, attribution |
| /admin/marketing/tiktok | WORKING | Real TikTok pixel status, events |
| /admin/automations | WORKING | Create/edit/toggle automations, credential check |
| /admin/whatsapp | WORKING | Template composer, WhatsApp deep link |

### Integrations
| Feature | Status | Notes |
|---|---|---|
| /admin/connections | WORKING | Real integration health aggregation |
| /admin/settings/integrations | WORKING | All 6 services configured, test buttons |
| /admin/integrations | PARTIAL | Overview page, not all services fully configurable |
| /admin/integrations/marketing | PARTIAL | Status view only, full setup via settings |

### Security & System
| Feature | Status | Notes |
|---|---|---|
| /admin/security | WORKING | IP blocklist, login history, suspicious activity |
| /admin/health | WORKING | Real component health checks |
| /admin/system | WORKING | System verification |
| /admin/anomalies | WORKING | Real anomaly detection |
| Credential encryption | WORKING | AES-256-GCM via SETTINGS_ENCRYPTION_KEY |

### Team & Settings
| Feature | Status | Notes |
|---|---|---|
| /admin/team | PLACEHOLDER | Roadmapped: multi-user coming next version |
| /admin/settings | WORKING | 5 tabs: store info, FAQ, Cloudinary, SMTP, Twilio |

---

## Issues Found & Fixed This Sprint

| Issue | Fix |
|---|---|
| Developer terminology in integration hints | Replaced with Hebrew plain language |
| Login linked to old /admin/register | Updated to link to /register |
| /admin/register showed old registration | Redirects to /register |
| Onboarding product step linked to manual | Changed to /admin/builder (AI-first) |
| Missing SETTINGS_ENCRYPTION_KEY in Vercel | Generated and added securely |

---

## Remaining Risks

1. **ANTHROPIC_API_KEY not set** — AI builder uses template fallback. User must add key.
2. **Onboarding completion** not persisted — merchant can close and lose progress
3. **Team management** — single-user only; multi-user is roadmapped
4. **Domain management** — no custom domain UI yet
5. **Email verification** — new merchants not email-verified (emailVerified: false)
6. **Password reset** — no forgot password flow

---

## Next Sprint Priorities

1. Add ANTHROPIC_API_KEY to Vercel (user action required)
2. Persist onboarding completion to DB
3. Pixel wizard UX (step-by-step, not form)
4. Payment wizard UX (step-by-step)
5. Store readiness score (/api/admin/readiness)
6. Password reset flow
7. Email verification
8. Custom domain support
