# NEXT_STEPS.md — Where to Resume
Last updated: 2026-05-25

## Sprint 3 Complete — Current Status

### What is fully working (no credentials needed):
- ✅ Product page reads from MongoDB — prices, images, stock from DB
- ✅ Orders can be created — slug fallback ensures product lookup works
- ✅ Admin campaigns page — create email campaigns, save drafts, view stats
- ✅ Admin settings — 4-tab credential manager UI (Cloudinary, SMTP, Twilio, Store)
- ✅ WhatsApp page — shows real DB automations, toggle active/paused
- ✅ Dashboard — real conversion rate and cart rate from VisitorEvent data
- ✅ Cardcom routing — integrations page now links correctly to /admin/payments

### What still needs credentials (10 min each):
1. **Cloudinary images** — Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Vercel
2. **Cardcom payments** — Add CARDCOM_TERMINAL_NUMBER, CARDCOM_API_USERNAME, CARDCOM_API_PASSWORD to Vercel
3. **Email campaigns** — Add SMTP_USER, SMTP_PASSWORD to Vercel → campaigns will actually send
4. **WhatsApp automations** — Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM to Vercel

### What URLs changed:
- `/admin/campaigns` — NEW: email campaign manager
- `/admin/settings` — UPGRADED: now has 4 credential tabs
- `/admin/whatsapp` — UPGRADED: shows real DB automations
- `/admin/integrations` — FIXED: Cardcom → /admin/payments, Twilio → /admin/whatsapp

### What is connected to MongoDB:
- Everything. No hardcoded data anywhere in admin panel.
- Product page reads: `pricing.sellingPrice`, `pricing.compareAtPrice`, `images`, `inventory.quantity`
- Orders: use real MongoDB `_id` as productId
- Campaigns: EmailCampaign model in MongoDB
- Settings: all credentials saved to Settings model

### What is live on production:
- All Sprint 3 code auto-committed and pushed via auto-backup script
- Vercel should auto-deploy from GitHub push

### What still blocks production:
- MONGODB_URI in Vercel env vars must point to Atlas (not localhost)
- Payment credentials (Cardcom) needed for checkout to complete
- Email/WhatsApp credentials for automation triggers

---

## Sprint 4 Candidates

### Immediate (high value):
1. **Customer auth** — login/register for customers, saved addresses, order history
2. **Order status flow** — Admin can mark orders shipped, enter tracking number
3. **CommLog cron job** — scheduled email sequences fire on time

### Medium priority:
4. **Collections UI** — product groupings visible in storefront
5. **A/B testing** — product page headline/CTA variants tracked via VisitorEvent
6. **IP blocking UI** — /admin/security: block IPs, whitelist, suspicious detection

---

## Architecture Cheatsheet

| What | Where |
|---|---|
| Admin auth | `src/lib/auth/adminAuth.ts` |
| Order creation + inventory | `src/app/api/orders/route.ts` |
| Coupon validation | `src/app/api/coupons/validate/route.ts` |
| Payment flow | `src/app/api/payment/initiate/route.ts` + `callback/route.ts` |
| Email campaign model | `src/lib/db/models/EmailCampaign.ts` |
| Email campaign API | `src/app/api/admin/campaigns/route.ts` |
| Product page (storefront) | `src/app/product/page.tsx` |
| Checkout | `src/app/(store)/checkout/page.tsx` |
| Auto-backup | `scripts/auto-backup.sh` |

## Critical Decisions
- Admin: `findcardsupport@gmail.com` / `F123456c!`
- Production: `https://project1-flame-phi.vercel.app`
- Prices in agorot (÷100 for display)
- Shipping always free
- Black card SVGs only (not competitor, not blue)
- All admin data from MongoDB — no hardcoded arrays
- Product page tiers: base × 1.0 / × 1.5 / × 1.9
