import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()

  const since30d = new Date(Date.now() - 30 * 86400000)

  const [products, eventStats, orderStats] = await Promise.all([
    Product.find({ status: 'active' }).select('_id slug nameHe images inventory pricing').lean(),

    // Per-product behavioral events
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: since30d }, path: { $regex: '^/products/' } } },
      { $addFields: {
          productSlug: { $arrayElemAt: [{ $split: ['$path', '/'] }, 2] },
        },
      },
      { $group: {
          _id: '$productSlug',
          pageViews: { $sum: { $cond: [{ $eq: ['$event', 'pageview'] }, 1, 0] } },
          productViews: { $sum: { $cond: [{ $eq: ['$event', 'product_view'] }, 1, 0] } },
          addToCarts: { $sum: { $cond: [{ $eq: ['$event', 'add_to_cart'] }, 1, 0] } },
          checkoutStarts: { $sum: { $cond: [{ $eq: ['$event', 'checkout_start'] }, 1, 0] } },
          galleryViews: { $sum: { $cond: [{ $eq: ['$event', 'gallery_view'] }, 1, 0] } },
          faqOpens: { $sum: { $cond: [{ $eq: ['$event', 'faq_open'] }, 1, 0] } },
          ctaClicks: { $sum: { $cond: [{ $eq: ['$event', 'cta_click'] }, 1, 0] } },
          rageClicks: { $sum: { $cond: [{ $eq: ['$event', 'rage_click'] }, 1, 0] } },
          scrollDepths: { $push: { $cond: [{ $eq: ['$event', 'scroll_depth'] }, '$scroll', null] } },
          mobileVisitors: { $addToSet: { $cond: [{ $eq: ['$device.type', 'mobile'] }, '$visitorId', null] } },
          allVisitors: { $addToSet: '$visitorId' },
          sessions: { $addToSet: '$sessionId' },
        },
      },
    ]),

    // Per-product purchase data (last 30d paid orders)
    Order.aggregate([
      { $match: { createdAt: { $gte: since30d }, ...PAID_FILTER } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.slug',
          revenue: { $sum: '$items.totalPrice' },
          units: { $sum: '$items.quantity' },
          orders: { $addToSet: '$_id' },
          avgOrderValue: { $avg: '$items.totalPrice' },
        },
      },
    ]),
  ])

  // Build lookup maps
  const eventMap = new Map(eventStats.map((e: {
    _id: string; pageViews: number; productViews: number; addToCarts: number
    checkoutStarts: number; galleryViews: number; faqOpens: number; ctaClicks: number
    rageClicks: number; scrollDepths: (number | null)[]; mobileVisitors: (string | null)[]
    allVisitors: string[]; sessions: string[]
  }) => [e._id, e]))
  const orderMap = new Map(orderStats.map((o: {
    _id: string; revenue: number; units: number; orders: string[]; avgOrderValue: number
  }) => [o._id, o]))

  const intelligence = products.map(p => {
    const ev = eventMap.get(p.slug)
    const ord = orderMap.get(p.slug)

    const views = ev?.pageViews || 0
    const productViews = ev?.productViews || 0
    const addToCarts = ev?.addToCarts || 0
    const checkoutStarts = ev?.checkoutStarts || 0
    const galleryViews = ev?.galleryViews || 0
    const faqOpens = ev?.faqOpens || 0
    const ctaClicks = ev?.ctaClicks || 0
    const rageClicks = ev?.rageClicks || 0
    const uniqueVisitors = ev?.allVisitors?.length || 0
    const scrollDepths = (ev?.scrollDepths || []).filter((s: number | null): s is number => typeof s === 'number')
    const avgScroll = scrollDepths.length > 0 ? Math.round(scrollDepths.reduce((a: number, b: number) => a + b, 0) / scrollDepths.length) : 0
    const maxScroll = scrollDepths.length > 0 ? Math.max(...scrollDepths) : 0
    const mobileCount = (ev?.mobileVisitors || []).filter((v: string | null): v is string => !!v).length
    const mobileRate = uniqueVisitors > 0 ? Math.round((mobileCount / uniqueVisitors) * 100) : 0

    const revenue = ord?.revenue || 0
    const units = ord?.units || 0
    const paidOrders = ord?.orders?.length || 0

    const cartRate = views > 0 ? Math.round((addToCarts / views) * 100) : 0
    const checkoutRate = addToCarts > 0 ? Math.round((checkoutStarts / addToCarts) * 100) : 0
    const purchaseRate = checkoutStarts > 0 ? Math.round((paidOrders / checkoutStarts) * 100) : 0
    const overallConversion = views > 0 ? Math.round((paidOrders / views) * 10000) / 100 : 0

    // Generate insights
    const insights: string[] = []
    if (cartRate > 20) insights.push(`שיעור הוספה לעגלה גבוה: ${cartRate}%`)
    if (cartRate < 5 && views > 20) insights.push(`שיעור הוספה לעגלה נמוך: ${cartRate}% — בדוק CTA ומחיר`)
    if (checkoutRate < 40 && checkoutStarts > 5) insights.push(`${100 - checkoutRate}% נוטשים checkout — בדוק עלויות משלוח`)
    if (galleryViews > views * 0.7) insights.push(`${Math.round((galleryViews/views)*100)}% מהמבקרים פותחים גלריה — תמונות חשובות`)
    if (faqOpens > views * 0.3) insights.push(`${Math.round((faqOpens/views)*100)}% פותחים FAQ — יש שאלות שלא עונות`)
    if (rageClicks > 3) insights.push(`${rageClicks} rage clicks — יש friction באלמנטים`)
    if (avgScroll < 40 && views > 20) insights.push(`גלילה ממוצעת ${avgScroll}% — תוכן חשוב עשוי להיות מתחת לfold`)
    if (mobileRate > 60) insights.push(`${mobileRate}% מהמבקרים על מובייל — חשוב לבדוק mobile UX`)

    return {
      slug: p.slug,
      name: p.nameHe,
      image: Array.isArray(p.images) ? (p.images[0] || '') : '',
      stock: p.inventory?.quantity ?? null,
      price: Math.round((p.pricing?.basePrice || 0) / 100),
      views,
      productViews,
      addToCarts,
      checkoutStarts,
      paidOrders,
      revenue: Math.round(revenue / 100),
      units,
      galleryViews,
      faqOpens,
      ctaClicks,
      rageClicks,
      avgScroll,
      maxScroll,
      mobileRate,
      uniqueVisitors,
      cartRate,
      checkoutRate,
      purchaseRate,
      overallConversion,
      insights,
    }
  }).sort((a, b) => b.revenue - a.revenue || b.views - a.views)

  return NextResponse.json({ products: intelligence, period: '30d' })
})
