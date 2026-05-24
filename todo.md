# FindCard Project - Task Tracker

## Completed ✅
- [x] Product SVG images redesigned (bright blue card, Spotminders style)
  - product-1-hero.svg — bright blue card tilted, light blue bg, gold chip, WiFi arcs
  - product-2-wallet.svg — blue card in front of two other cards (fanned)
  - product-3-bundle.svg — 3 blue cards fanned, dark background
  - product-4-features.svg — blue card with Hebrew callout annotations
- [x] Homepage product preview section: replaced emoji with product-2-wallet.svg
- [x] Feature carousel labels fixed (8 חודשי סוללה not just "8")
- [x] All yellow colors removed → blue/white only
- [x] Announcement bar: "משלוח חינם על כל הזמנה"
- [x] WhatsApp bubble (fixed bottom-left, 9720525884463)
- [x] Product gallery (4 images + main display)
- [x] Add to Cart button: white bg, blue text
- [x] Tier pricing: "1 כרטיס" → "כרטיס 1" + removed all gift mentions
- [x] Return policy: marketing + legal split
- [x] Reviews: added 3-star + typos/slang for authenticity (10 reviews total)
- [x] Customer count: 2,000+ | Reviews: 312
- [x] Android product removed from seed
- [x] Hero image: product-1-hero.svg (blue card)
- [x] Feature carousel label: 1.8mm → "דק — נכנס לכל מקום"
- [x] Hebrew text review: fixed AI-sounding phrases throughout site
  - Feature descriptions rewritten in colloquial Hebrew
  - FAQ Android answer shortened + natural
  - Guarantee text made more natural
  - Delivery note more conversational

## Admin Panel - COMPLETED ✅
- [x] AdminSidebar full redesign:
  - Logo (FC badge + FindCard name)
  - Live visitor counter with pulsing green dot (polls every 8s)
  - Sectioned menu: ניהול + חנות
  - All new menu items
  - Better visual design (dark sidebar)
- [x] Admin Dashboard full redesign:
  - Global search bar
  - Live visitor counter
  - 4 KPI cards row 1 (revenue today/month, new customers, avg order)
  - 4 metric cards row 2 (conversion %, cart %, open orders, abandoned carts)
  - Hourly revenue SVG bar chart
  - Order funnel visualization
  - Today's orders + abandoned carts count cards
  - Quick actions card
  - Recent orders table
  - Live activity feed (auto-refreshes every 12s with fake activity)
- [x] Dashboard API updated: newCustomersToday, avgOrderValue, conversionRate, cartRate
- [x] /admin/reviews — Approve/reject reviews, filter by status
- [x] /admin/coupons — Create/manage discount codes (toggle active, delete)
- [x] /admin/abandoned-carts — View + send reminder per cart or all at once
- [x] /admin/reports — Weekly/monthly bar charts, top products, KPI summary
- [x] /admin/whatsapp — Message templates, editor, preview, send via wa.me, log
- [x] /admin/invoices — Invoice list + browser print function
- [x] /admin/payments — Transaction list, summary cards, filter by status

## Pending ⏳
- [ ] Social media links in Footer (waiting for user to provide Instagram/TikTok links)

## Notes
- Admin panel: all new pages have full Hebrew UI with mock data (ready for real API integration)
- Images: all 4 SVGs now use bright blue card style (Spotminders-inspired)
- Hebrew: reviewed and fixed AI-sounding phrases throughout homepage and product page
