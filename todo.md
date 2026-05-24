# FindCard Project - Task Tracker

## Completed ✅
- [x] Product SVG images redesigned (bright blue card, Spotminders style)
  - product-1-hero.svg — blue card tilted, light background
  - product-2-wallet.svg — blue card with two other cards behind it
  - product-3-bundle.svg — 3 blue cards fanned, dark background
  - product-4-features.svg — blue card with Hebrew callout annotations
- [x] Homepage product preview section: replaced emoji with product-2-wallet.svg
- [x] Feature carousel labels fixed (8 חודשי סוללה not just "8")
- [x] All yellow colors removed → blue/white only
- [x] Announcement bar: "משלוח חינם על כל הזמנה"
- [x] WhatsApp bubble (fixed bottom-left, 9720525884463)
- [x] Product gallery (4 images + main display)
- [x] Add to Cart button: white bg, blue text
- [x] Tier pricing: removed all gift mentions
- [x] Return policy: marketing + legal split
- [x] Reviews: added 3-star + typos/slang for authenticity
- [x] Customer count: 2,000+ | Reviews: 312
- [x] Android product removed from seed
- [x] Hero image: product-1-hero.svg (blue card)
- [x] Feature carousel label: 1.8mm → "דק — נכנס לכל מקום"

## In Progress 🔄
- [ ] Admin panel full overhaul (MAJOR TASK)

## Admin Panel - Detailed Plan
Based on the Hebrew admin screenshot the user provided, replicate these features:

### Sidebar Menu Items:
- תצוגה חיה (LIVE indicator)
- לוח בקרה (Dashboard - current)
- הזמנות (Orders - current)
- מוצרים (Products - current)
- ביקורות (Reviews - NEW)
- גלריה (Gallery - NEW)
- לקוחות (Customers - current)
- קופונים (Coupons - NEW)
- עגלות נטושות (Abandoned Carts - NEW)
- דוחות (Reports - NEW)
- ניהול החנות (Store Management - Settings)
- דפי נחיתה (Landing Pages - NEW)
- תשלומים (Payments - NEW)
- חשבוניות (Invoices - NEW)
- וואטסאפ (WhatsApp - NEW)
- התנתקות (Logout)

### Dashboard Features to Add:
- [ ] Live visitor counter with pulsing green dot + count
- [ ] 4 KPI cards: הכנסות (Revenue), הזמנות (Orders), לקוחות חדשים (New customers), ממוצע הזמנה (Avg order)
- [ ] Second row stats: המרה %, עגלות %, ממוצע ₪, בביצוע
- [ ] Hourly revenue bar chart (12 bars for today's hours)
- [ ] Order funnel (visitors → cart → checkout → purchase)
- [ ] "הזמנות היום" and "עגלות היום" count cards
- [ ] Live activity feed (real-time order notifications)
- [ ] Recent orders table
- [ ] Global search bar

### New Admin Pages:
- [ ] /admin/reviews — Manage product reviews (approve/reject/reply)
- [ ] /admin/coupons — Create/manage discount coupons
- [ ] /admin/abandoned-carts — View carts that weren't completed
- [ ] /admin/reports — Revenue/orders/customers charts
- [ ] /admin/whatsapp — WhatsApp message templates + history
- [ ] /admin/invoices — Generate/view PDF invoices for orders
- [ ] /admin/payments — Payment transactions list

### Files to Create/Modify:
- [ ] src/app/admin/layout.tsx — New sidebar with all menu items
- [ ] src/components/layout/AdminSidebar.tsx — Full redesign
- [ ] src/app/admin/page.tsx — Full dashboard redesign
- [ ] src/app/admin/reviews/page.tsx — NEW
- [ ] src/app/admin/coupons/page.tsx — NEW
- [ ] src/app/admin/abandoned-carts/page.tsx — NEW
- [ ] src/app/admin/reports/page.tsx — NEW
- [ ] src/app/admin/whatsapp/page.tsx — NEW
- [ ] src/app/admin/invoices/page.tsx — NEW
- [ ] src/app/admin/payments/page.tsx — NEW
- [ ] src/lib/db/models/Coupon.ts — NEW model
- [ ] src/lib/db/models/AbandonedCart.ts — NEW model
- [ ] src/app/api/admin/dashboard/route.ts — Stats API
- [ ] src/app/api/admin/reviews/* — Reviews API
- [ ] src/app/api/admin/coupons/* — Coupons API

## Pending ⏳
- [ ] Social media links in Footer (waiting for user to provide Instagram/TikTok links)

## Notes
- Admin panel should feel like a full Hebrew e-commerce control center
- All text RTL Hebrew
- Use same blue color scheme (#2563EB, #1D4ED8)
- Real-time features can use polling (every 5-10s) for MVP
