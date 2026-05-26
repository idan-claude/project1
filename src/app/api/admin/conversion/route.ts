import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

const PAID_FILTER = { 'payment.status': 'paid', testMode: { $ne: true } }

export const GET = withAdminAuth(async () => {
  await connectDB()

  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    productViews,
    cartEvents,
    checkoutStarts,
    checkoutCompletes,
    paidOrders30,
    orderStats,
    pagePerf,
    exitPages,
  ] = await Promise.all([
    VisitorEvent.countDocuments({ event: 'product_view', createdAt: { $gte: d30 } }),
    VisitorEvent.countDocuments({ event: 'add_to_cart', createdAt: { $gte: d30 } }),
    VisitorEvent.countDocuments({ event: 'checkout_start', createdAt: { $gte: d30 } }),
    VisitorEvent.countDocuments({ event: 'checkout_complete', createdAt: { $gte: d30 } }),
    Order.countDocuments({ createdAt: { $gte: d30 }, ...PAID_FILTER }),
    Order.aggregate([
      { $match: { createdAt: { $gte: d30 }, ...PAID_FILTER } },
      { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' }, avgOrderValue: { $avg: '$pricing.total' } } },
    ]),
    // Page performance: unique visitors per path
    VisitorEvent.aggregate([
      { $match: { event: 'pageview', createdAt: { $gte: d30 } } },
      { $group: { _id: '$path', visitors: { $addToSet: '$visitorId' }, sessions: { $sum: 1 } } },
      { $project: { path: '$_id', visitors: { $size: '$visitors' }, sessions: 1 } },
      { $sort: { sessions: -1 } },
      { $limit: 10 },
    ]),
    // Exit pages (last page viewed per session before no checkout_complete)
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: d30 } } },
      { $sort: { sessionId: 1, createdAt: -1 } },
      { $group: { _id: '$sessionId', lastPath: { $first: '$path' }, events: { $push: '$event' } } },
      { $match: { events: { $not: { $elemMatch: { $in: ['checkout_complete'] } } } } },
      { $group: { _id: '$lastPath', exits: { $sum: 1 } } },
      { $sort: { exits: -1 } },
      { $limit: 5 },
    ]),
  ])

  const totalRevenue = orderStats[0]?.totalRevenue || 0
  const avgOrderValue = orderStats[0]?.avgOrderValue || 0
  const paidOrders = paidOrders30

  // Funnel drop-off analysis
  const cartConversion = productViews > 0 ? (cartEvents / productViews) * 100 : 0
  const checkoutConversion = cartEvents > 0 ? (checkoutStarts / cartEvents) * 100 : 0
  const purchaseConversion = checkoutStarts > 0 ? (paidOrders / checkoutStarts) * 100 : 0
  const overallConversion = productViews > 0 ? (paidOrders / productViews) * 100 : 0

  // Detect friction points
  const insights: Array<{ severity: 'critical' | 'warning' | 'info'; title: string; detail: string; action: string }> = []

  if (cartConversion < 5 && productViews > 10) {
    insights.push({
      severity: 'critical',
      title: `רק ${cartConversion.toFixed(1)}% מהמבקרים מוסיפים לסל`,
      detail: `מתוך ${productViews} ביקורים רק ${cartEvents} הוסיפו לסל. בממוצע בתחום: 8-12%.`,
      action: 'שפר את כפתור "הוסף לסל", הוסף ביקורות מעל הקנייה, בדוק מהירות טעינה',
    })
  }

  if (checkoutConversion < 50 && cartEvents > 5) {
    insights.push({
      severity: cartConversion < 30 ? 'critical' : 'warning',
      title: `${(100 - checkoutConversion).toFixed(0)}% נוטשים את הסל לפני תשלום`,
      detail: `${cartEvents - checkoutStarts} אנשים הוסיפו לסל אבל לא הגיעו לדף תשלום.`,
      action: 'הפעל אוטומציית עגלה נטושה, הצג תמריצי דחיפות (כמות מוגבלת, תאריך)',
    })
  }

  if (purchaseConversion < 60 && checkoutStarts > 3) {
    insights.push({
      severity: 'warning',
      title: `${(100 - purchaseConversion).toFixed(0)}% נוטשים בדף תשלום`,
      detail: `${checkoutStarts - paidOrders} אנשים התחילו תשלום ולא השלימו.`,
      action: 'קצר טופס, הוסף Trust badges, בדוק שחיבור Cardcom תקין',
    })
  }

  if (avgOrderValue < 15000 && paidOrders > 0) {
    insights.push({
      severity: 'info',
      title: `ממוצע הזמנה נמוך: ₪${(avgOrderValue / 100).toFixed(0)}`,
      detail: 'ניתן להגדיל AOV עם הצעות Upsell וחבילות מרובות.',
      action: 'הוסף "רכשו גם יחד" בדף מוצר, הצג חבילה 3+1 כברירת מחדל',
    })
  }

  if (overallConversion > 2 && paidOrders > 0) {
    insights.push({
      severity: 'info',
      title: `המרה כוללת ${overallConversion.toFixed(1)}% — טוב!`,
      detail: 'ממוצע בתחום eCommerce הישראלי: 1.5-3%. אתה בטווח הנורמלי.',
      action: 'המשך לבצע A/B testing על מחירים וכותרות',
    })
  }

  return NextResponse.json({
    funnel: {
      productViews,
      cartEvents,
      checkoutStarts,
      checkoutCompletes,
      paidOrders,
    },
    rates: {
      cartConversion: Math.round(cartConversion * 10) / 10,
      checkoutConversion: Math.round(checkoutConversion * 10) / 10,
      purchaseConversion: Math.round(purchaseConversion * 10) / 10,
      overallConversion: Math.round(overallConversion * 100) / 100,
    },
    revenue: {
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue),
      paidOrders,
    },
    pagePerf,
    exitPages,
    insights,
  })
})
