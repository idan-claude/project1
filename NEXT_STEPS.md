# NEXT_STEPS.md — Where to Resume
Last updated: 2026-05-25

## Sprint 2 Complete — Where to go next

### Immediate (requires credentials — 10 min each):
1. **Cloudinary images** — Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Vercel
2. **Cardcom payments** — Add CARDCOM_TERMINAL_NUMBER, CARDCOM_API_USERNAME, CARDCOM_API_PASSWORD to Vercel
3. **Email automations** — Add SMTP_USER, SMTP_PASSWORD to Vercel → automations will fire on order confirm
4. **WhatsApp automations** — Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM to Vercel

### Sprint 3 Candidates:
1. **Customer auth** — login/register for customers, saved addresses, order history
2. **Order status flow** — Admin can mark orders shipped, enter tracking number
3. **Multi-product** — Product variants visible in storefront, cart supports variant selection
4. **IP blocking UI** — /admin/security: block IPs, whitelist, suspicious detection
5. **Visitor analytics granular** — scroll depth, rage clicks, heatmap data collection
6. **A/B testing** — product page headline/CTA variants tracked via VisitorEvent

## Resume Point (start here after any reset)

### Step 1 — Check git status
```bash
git log --oneline -5  # see latest auto-backup commits
git status            # should be clean
```

### Step 2 — Enable MongoDB Atlas (CRITICAL for production)
1. Go to https://cloud.mongodb.com and create a cluster
2. Get the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/tracker-store`
3. Update `.env.local`: `MONGODB_URI=<atlas_uri>`
4. Also add to Vercel environment variables dashboard

### Step 3 — Enable crontab auto-backup (user must run once)
```bash
crontab -e
# Add this line:
*/30 * * * * /Users/idanyehiel/Documents/project1/scripts/auto-backup.sh >> /tmp/findcard-backup.log 2>&1
```

### Step 4 — Configure Cardcom payment credentials
Fill in `.env.local`:
```
CARDCOM_TERMINAL_NUMBER=<your_terminal>
CARDCOM_API_USERNAME=<your_username>
CARDCOM_API_PASSWORD=<your_password>
```

### Step 5 — Configure email (SMTP)
Fill in `.env.local`:
```
SMTP_USER=findcardsupport@gmail.com
SMTP_PASSWORD=<app_password_from_gmail>
```
Gmail: enable 2FA → App Passwords → create one for "Mail"

### Step 6 — Customer auth UI
Create `src/app/(store)/account/` with:
- `login/page.tsx` — email/password form → NextAuth signIn
- `register/page.tsx` — create user account
- `orders/page.tsx` — customer's order history

### Step 7 — CommLog cron job
Create `src/app/api/cron/emails/route.ts`:
```typescript
import { processPendingScheduled } from '@/lib/db/models/CommLog'
export async function GET() {
  await connectDB()
  await processPendingScheduled()
  return NextResponse.json({ ok: true })
}
```
Then add to Vercel Cron or run via crontab.

---

## Architecture Cheatsheet

| What | Where |
|---|---|
| Admin auth | `src/lib/auth/adminAuth.ts` |
| Order creation + inventory | `src/app/api/orders/route.ts` |
| Coupon validation | `src/app/api/coupons/validate/route.ts` |
| Payment flow | `src/app/api/payment/initiate/route.ts` + `callback/route.ts` |
| Coupon model | `src/lib/db/models/Coupon.ts` |
| Review model | `src/lib/db/models/Review.ts` |
| Product model | `src/lib/db/models/Product.ts` |
| Email templates | `src/lib/email/templates.ts` |
| Product page | `src/app/product/page.tsx` |
| Checkout | `src/app/(store)/checkout/page.tsx` |
| Auto-backup | `scripts/auto-backup.sh` |

## Critical Decisions
- Admin: `findcardsupport@gmail.com` / `F123456c!`
- Production: `https://project1-flame-phi.vercel.app`
- Prices in agorot (÷100 for display)
- Shipping always free
- Black card SVGs only (not competitor, not blue)
- All admin data from MongoDB — no hardcoded arrays
