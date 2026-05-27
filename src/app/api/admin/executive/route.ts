import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Product from '@/lib/db/models/Product'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

function normalizeSource(source: string, medium: string, referrer: string): string {
  const s = (source || '').toLowerCase()
  const m = (medium || '').toLowerCase()
  const r = (referrer || '').toLowerCase()
  if (s.includes('facebook') || s.includes('fb')) return 'Meta'
  if (s.includes('instagram') || r.includes('instagram')) return 'Instagram'
  if (s.includes('tiktok') || r.includes('tiktok')) return 'TikTok'
  if (s.includes('google') || m.includes('cpc')) return 'Google'
  if (s.includes('whatsapp') || r.includes('whatsapp')) return 'WhatsApp'
  if (m.includes('email')) return 'Email'
  if (!s && !m && !r) return 'ישיר'
  if (r && !s) return 'Referral'
  return source ? source.charAt(0).toUpperCase() + source.slice(1) : 'אחר'
}

export const GET = withAdminAuth(async () => {
  await connectDB()

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1)
  const since7d = new Date(now.getTime() - 7 * 86400000)
  const since30d = new Date(now.getTime() - 30 * 86400000)
  const prev30d = new Date(now.getTime() - 60 * 86400000)

  const [
    revenueToday,
    revenueYesterday,
    revenue7d,
    revenue30d,
    revenuePrev30d,
    ordersToday,
    orders7d,
    orders30d,
    visitorsToday,
    visitors7d,
    visitors30d,
    cartAdds7d,
    checkoutStarts7d,
    topProducts7d,
    recentOrders,
    topSources7d,
    returningVisitors7d,
    productCount,
  ] = await Promise.all([
    // Revenue queries
    Order.aggregate([{ $match: { createdAt: { $gte: todayStart }, ...PAID_FILTER } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: yesterdayStart, $lt: todayStart }, ...PAID_FILTER } }, { $group: { _id: null, total: { $sum: '$pricing.total' } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: since7d }, ...PAID_FILTER } }, { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: since30d }, ...PAID_FILTER } }, { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: prev30d, $lt: since30d }, ...PAID_FILTER } }, { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }]),

    // Order counts
    Order.countDocuments({ createdAt: { $gte: todayStart }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: since30d }, ...PAID_FILTER }),

    // Visitors
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: todayStart } }),
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: since7d } }),
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: since30d } }),

    // Funnel
    VisitorEvent.countDocuments({ event: 'add_to_cart', createdAt: { $gte: since7d } }),
    VisitorEvent.countDocuments({ event: 'checkout_start', createdAt: { $gte: since7d } }),

    // Top products by revenue
    Order.aggregate([
      { $match: { createdAt: { $gte: since7d }, ...PAID_FILTER } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.slug',
          name: { $first: '$items.nameHe' },
          revenue: { $sum: '$items.totalPrice' },
          units: { $sum: '$items.quantity' },
          orders: { $addToSet: '$_id' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),

    // Recent paid orders
    Order.find({ ...PAID_FILTER }).sort({ createdAt: -1 }).limit(5).lean(),

    // Top traffic sources
    VisitorEvent.aggregate([
      { $match: { event: 'pageview', createdAt: { $gte: since7d } } },
      { $group: { _id: { source: '$utm.source', medium: '$utm.medium', referrer: '$referrer' }, visitors: { $addToSet: '$visitorId' } } },
      { $sort: { 'visitors': -1 } },
      { $limit: 20 },
    ]),

    // Returning visitors (visited in prev 7d too)
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: since7d, $lt: now }, 'utm.source': '' }),

    // Active product count
    Product.countDocuments({ status: 'active' }),
  ])

  const todayRevenue = revenueToday[0]?.total || 0
  const yesterdayRevenue = revenueYesterday[0]?.total || 0
  const rev7d = revenue7d[0]?.total || 0
  const rev30d = revenue30d[0]?.total || 0
  const revPrev30d = revenuePrev30d[0]?.total || 0
  const count30d = revenue30d[0]?.count || 0
  const countPrev30d = revenuePrev30d[0]?.count || 0

  const revGrowth30d = revPrev30d > 0 ? Math.round(((rev30d - revPrev30d) / revPrev30d) * 100) : null
  const ordersGrowth30d = countPrev30d > 0 ? Math.round(((count30d - countPrev30d) / countPrev30d) * 100) : null

  // Daily revenue trend (last 7 days)
  const dailyTrend = await Order.aggregate([
    { $match: { createdAt: { $gte: since7d }, ...PAID_FILTER } },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Source aggregation
  const sourceRevMap = new Map<string, { visitors: number; revenue: number; orders: number }>()
  for (const s of topSources7d) {
    const label = normalizeSource(s._id.source, s._id.medium, s._id.referrer)
    const ex = sourceRevMap.get(label) || { visitors: 0, revenue: 0, orders: 0 }
    ex.visitors += s.visitors.length
    sourceRevMap.set(label, ex)
  }

  const paidBySource = await Order.aggregate([
    { $match: { createdAt: { $gte: since7d }, ...PAID_FILTER } },
    { $group: { _id: { source: '$attribution.source', medium: '$attribution.medium' }, revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
  ])
  for (const s of paidBySource) {
    const label = normalizeSource(s._id.source, s._id.medium, '')
    const ex = sourceRevMap.get(label) || { visitors: 0, revenue: 0, orders: 0 }
    ex.revenue += s.revenue
    ex.orders += s.count
    sourceRevMap.set(label, ex)
  }

  const topSources = Array.from(sourceRevMap.entries())
    .map(([source, data]) => ({ source, ...data }))
    .sort((a, b) => (b.revenue || b.visitors) - (a.revenue || a.visitors))
    .slice(0, 6)

  const visitorsToday30 = visitorsToday.length
  const visitors7dCount = visitors7d.length
  const visitors30dCount = visitors30d.length

  const convRate7d = visitors7dCount > 0 ? Math.round((orders7d / visitors7dCount) * 10000) / 100 : 0
  const cartRate7d = visitors7dCount > 0 ? Math.round((cartAdds7d / visitors7dCount) * 100) : 0
  const checkoutRate7d = cartAdds7d > 0 ? Math.round((checkoutStarts7d / cartAdds7d) * 100) : 0
  const purchaseRate7d = checkoutStarts7d > 0 ? Math.round((orders7d / checkoutStarts7d) * 100) : 0

  return NextResponse.json({
    revenue: {
      today: Math.round(todayRevenue / 100),
      yesterday: Math.round(yesterdayRevenue / 100),
      todayDelta: yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : null,
      last7d: Math.round(rev7d / 100),
      last30d: Math.round(rev30d / 100),
      growth30d: revGrowth30d,
    },
    orders: {
      today: ordersToday,
      last7d: orders7d,
      last30d: count30d,
      growth30d: ordersGrowth30d,
      avgValue7d: orders7d > 0 ? Math.round((rev7d / orders7d) / 100) : 0,
    },
    visitors: {
      today: visitorsToday30,
      last7d: visitors7dCount,
      last30d: visitors30dCount,
    },
    funnel: {
      visitors7d: visitors7dCount,
      cartAdds7d,
      checkoutStarts7d,
      purchases7d: orders7d,
      cartRate7d,
      checkoutRate7d,
      purchaseRate7d,
      conversionRate7d: convRate7d,
    },
    topProducts: topProducts7d.map(p => ({
      slug: p._id,
      name: p.name,
      revenue: Math.round(p.revenue / 100),
      units: p.units,
      orders: p.orders.length,
    })),
    topSources,
    recentOrders: recentOrders.map(o => ({
      orderNumber: o.orderNumber,
      customer: o.customer.name,
      total: Math.round(o.pricing.total / 100),
      createdAt: o.createdAt,
      source: normalizeSource(o.attribution?.source || '', o.attribution?.medium || '', o.attribution?.referrer || ''),
    })),
    dailyTrend: dailyTrend.map(d => ({
      date: d._id,
      revenue: Math.round(d.revenue / 100),
      orders: d.orders,
    })),
    meta: {
      productCount,
      returningVisitors: returningVisitors7d.length,
      returningRate: visitors7dCount > 0 ? Math.round((returningVisitors7d.length / visitors7dCount) * 100) : 0,
    },
  })
})
