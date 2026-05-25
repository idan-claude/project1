# BUGS.md — Known Issues & Workarounds
Last updated: 2026-05-25

## 🔴 CRITICAL

None currently.

## 🟠 REQUIRES CREDENTIALS

| Bug | Root cause | Fix |
|---|---|---|
| Cloudinary upload returns 503 | CLOUDINARY_* env vars missing | Add to Vercel |
| Cardcom payment fails | CARDCOM_* env vars missing | Add to Vercel |
| Email automations not sending | SMTP_USER/SMTP_PASSWORD missing | Add to Vercel |
| WhatsApp not sending | TWILIO_* env vars missing | Add to Vercel |

## 🟡 KNOWN LIMITATIONS

| Issue | Details | Workaround |
|---|---|---|
| Visitor tracking requires JS | SSR visitors not tracked | Acceptable — JS-based tracking is standard |
| Automation delay (>5min) | Vercel serverless can't hold setTimeout for long delays | For prod: use Vercel Cron or external queue |
| Multi-store is scaffold only | storeId added to models but no tenant UI yet | Add /admin/stores in Sprint 4 |
| AliExpress import | Needs ALIEXPRESS_APP_KEY/SECRET | Add credentials |

## ✅ RESOLVED (Sprint 1-2)

- TS2802 Set iteration — fixed with Array.from()
- withAdminAuth params type — fixed to Record<string, string>
- Cardcom baseUrl localhost fallback — fixed with VERCEL_URL
- Product page BiDi — dir="rtl" explicit, ltr spans for brand names
- Automations placeholder — replaced with real DB-backed system
- Funnels placeholder — replaced with real VisitorEvent data
