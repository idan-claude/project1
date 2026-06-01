# Integration UX Audit
**Date:** 2026-06-01  
**Standard:** No merchant should need developer knowledge to connect any integration.

---

## ✅ PASS — Files with no issues

| File | Status |
|------|--------|
| `src/app/admin/marketing/meta/page.tsx` | Clean — no ENV/Vercel references |
| `src/app/admin/marketing/tiktok/page.tsx` | Clean — no ENV/Vercel references |
| `src/app/admin/security/page.tsx` | Clean |
| `src/app/admin/automations/page.tsx` | Clean |

---

## ❌ FAIL — Files with developer terminology (fixed in this sprint)

### 1. `src/app/admin/connections/page.tsx`
| Problem | Developer Terminology Found | Fix |
|---------|----------------------------|-----|
| Help footer (line 339) | "פרטי גישה מוגדרים דרך **Vercel Environment Variables** בלבד" | Replaced with link to settings/integrations |

### 2. `src/app/admin/payments/page.tsx`
| Problem | Developer Terminology Found | Fix |
|---------|----------------------------|-----|
| Tab label | "הגדרות **Webhook**" | Renamed to "חיבור Cardcom" |
| Provider legend | "אישורי **API** מוגדרים ב-**Vercel Environment Variables**" | Removed entirely |
| Settings tab | **Vercel Dashboard** button | Removed |
| Settings tab | ENV var names: `CARDCOM_TERMINAL_NUMBER`, `CARDCOM_API_USERNAME`, `CARDCOM_API_PASSWORD` | Removed |
| Settings tab | "הגדרת פרטי חיבור" → Vercel required | Replaced with Cardcom connection form |

### 3. `src/app/admin/settings/page.tsx`
| Problem | Developer Terminology Found | Fix |
|---------|----------------------------|-----|
| Cloudinary tab | "**API Key**", "**API Secret**" labels | Renamed to merchant-friendly labels |
| Cloudinary tab | "הוסף גם לסביבת **Vercel**: CLOUDINARY_*" | Removed |
| SMTP tab | "כתובת אימייל (**SMTP User**)" | Cleaned to "כתובת מייל שולחת" |
| SMTP tab | "הוסף: SMTP_USER, SMTP_PASSWORD לסביבת **Vercel**" | Removed |
| Twilio tab | "**Account SID**", "**Auth Token**" labels | Made merchant-friendly |
| Twilio tab | "הוסף: TWILIO_* לסביבת **Vercel**" | Removed |
| FAQ tab | "מסונכרן מיידית ללא **deploy**" | Cleaned to "מסונכרן מיידית" |

### 4. `src/app/admin/integrations/marketing/page.tsx`
| Problem | Developer Terminology Found | Fix |
|---------|----------------------------|-----|
| Expanded card | "**משתני סביבה** להוסיף ב-**Vercel**:" section | Removed entirely |
| Expanded card | ENV var names with copy buttons (e.g. `NEXT_PUBLIC_META_PIXEL_ID`) | Removed |
| Expanded card | "פתח **Vercel Dashboard** להוספת משתנים ↗" button | Replaced with link to settings/integrations |
| Bottom note | "אחרי שינוי **משתני סביבה** יש לפרס מחדש ב-**Vercel**" | Removed |

### 5. `src/app/admin/settings/integrations/page.tsx` (minor field label issues)
| Problem | Developer Terminology Found | Fix |
|---------|----------------------------|-----|
| Cardcom fields | "שם משתמש **API**", "סיסמת **API**" | Renamed to "שם משתמש", "סיסמה" |
| Twilio fields | "**Account SID**", "**Auth Token**" | Made merchant-friendly with good hints |
| Cloudinary fields | "**API Key**", "**API Secret**" | Made merchant-friendly |

---

## Architecture Rule (Platform-Wide)

Every integration must follow:
1. **Connect** — merchant enters credentials via simple form
2. **Verify** — system tests the connection automatically
3. **Active** — integration is live

Status badges: **מחובר** | **דורש תשומת לב** | **לא מחובר**

No page in the admin may reference: Vercel, ENV variables, API Keys (as technical labels), Tokens (as technical labels), Webhook setup instructions, deployment steps, terminal commands.

---

## Status after this sprint

All 5 failing files have been fixed. Platform now passes UX review.
