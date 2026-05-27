import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

// Source normalizer — maps raw UTM/referrer to clean channel label
function normalizeSource(source: string, medium: string, referrer: string): string {
  const s = (source || '').toLowerCase()
  const m = (medium || '').toLowerCase()
  const r = (referrer || '').toLowerCase()

  if (s.includes('facebook') || s.includes('fb') || m.includes('paid') && r.includes('facebook')) return 'Meta'
  if (s.includes('instagram') || r.includes('instagram')) return 'Instagram'
  if (s.includes('tiktok') || r.includes('tiktok')) return 'TikTok'
  if (s.includes('google') || m.includes('cpc') || m.includes('ppc')) return 'Google'
  if (s.includes('whatsapp') || r.includes('whatsapp')) return 'WhatsApp'
  if (m.includes('email') || s.includes('email')) return 'Email'
  if (m.includes('organic') || m === 'organic') return 'Organic'
  if (r && !s && !m) {
    if (r.includes('google')) return 'Organic Search'
    return 'Referral'
  }
  if (!s && !m && !r) return 'Direct'
  return source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Other'
}

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()

  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') || '30')
  const since = new Date(Date.now() - days * 86400000)

  const [
    revenueBySource,
    visitorsBySource,
    conversionsBySource,
  ] = await Promise.all([
    // Revenue + paid orders by attribution source
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, ...PAID_FILTER } },
      { $group: {
          _id: {
            source: '$attribution.source',
            medium: '$attribution.medium',
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' },
          referrers: { $addToSet: '$attribution.referrer' },
        },
      },
      { $sort: { revenue: -1 } },
    ]),

    // Unique visitors by UTM source (last 30d)
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: since }, event: 'pageview' } },
      { $group: {
          _id: { source: '$utm.source', medium: '$utm.medium', referrer: '$referrer' },
          visitors: { $addToSet: '$visitorId' },
          sessions: { $addToSet: '$sessionId' },
        },
      },
    ]),

    // Checkout starts by source (for conversion rate)
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: since }, event: { $in: ['checkout_start', 'add_to_cart'] } } },
      { $group: {
          _id: { source: '$utm.source', medium: '$utm.medium' },
          checkoutStarts: { $sum: { $cond: [{ $eq: ['$event', 'checkout_start'] }, 1, 0] } },
          cartAdds: { $sum: { $cond: [{ $eq: ['$event', 'add_to_cart'] }, 1, 0] } },
        },
      },
    ]),
  ])

  // Build unified attribution map
  const sourceMap = new Map<string, {
    source: string
    revenue: number
    orders: number
    avgOrderValue: number
    visitors: number
    sessions: number
    checkoutStarts: number
    cartAdds: number
    conversionRate: number
    roas: number | null
  }>()

  for (const r of revenueBySource) {
    const label = normalizeSource(r._id.source || '', r._id.medium || '', '')
    const existing = sourceMap.get(label)
    if (existing) {
      existing.revenue += r.revenue
      existing.orders += r.orders
    } else {
      sourceMap.set(label, {
        source: label,
        revenue: r.revenue,
        orders: r.orders,
        avgOrderValue: r.avgOrderValue,
        visitors: 0,
        sessions: 0,
        checkoutStarts: 0,
        cartAdds: 0,
        conversionRate: 0,
        roas: null,
      })
    }
  }

  for (const v of visitorsBySource) {
    const label = normalizeSource(v._id.source || '', v._id.medium || '', v._id.referrer || '')
    const existing = sourceMap.get(label)
    if (existing) {
      existing.visitors += v.visitors.length
      existing.sessions += v.sessions.length
    } else {
      sourceMap.set(label, {
        source: label,
        revenue: 0,
        orders: 0,
        avgOrderValue: 0,
        visitors: v.visitors.length,
        sessions: v.sessions.length,
        checkoutStarts: 0,
        cartAdds: 0,
        conversionRate: 0,
        roas: null,
      })
    }
  }

  for (const c of conversionsBySource) {
    const label = normalizeSource(c._id.source || '', c._id.medium || '', '')
    const existing = sourceMap.get(label)
    if (existing) {
      existing.checkoutStarts += c.checkoutStarts
      existing.cartAdds += c.cartAdds
    }
  }

  // Compute conversion rates
  const results = Array.from(sourceMap.values()).map(s => ({
    ...s,
    conversionRate: s.visitors > 0 ? Math.round((s.orders / s.visitors) * 10000) / 100 : 0,
    avgOrderValue: s.orders > 0 ? Math.round(s.avgOrderValue) : 0,
    cartRate: s.visitors > 0 ? Math.round((s.cartAdds / s.visitors) * 10000) / 100 : 0,
    revenueDisplay: Math.round(s.revenue / 100),
    avgOrderDisplay: Math.round(s.avgOrderValue / 100),
  })).sort((a, b) => b.revenue - a.revenue)

  // Top insights
  const insights: string[] = []
  if (results.length >= 2) {
    const best = results.reduce((a, b) => a.conversionRate > b.conversionRate ? a : b)
    if (best.conversionRate > 0) insights.push(`${best.source} מוביל בשיעור המרה: ${best.conversionRate}%`)
    const highAov = results.filter(r => r.orders > 0).reduce((a, b) => a.avgOrderValue > b.avgOrderValue ? a : b)
    if (highAov.avgOrderDisplay > 0) insights.push(`ה-AOV הגבוה ביותר מגיע מ-${highAov.source}: ₪${highAov.avgOrderDisplay}`)
    const cartLeader = results.reduce((a, b) => a.cartRate > b.cartRate ? a : b)
    if (cartLeader.cartRate > 0 && cartLeader.orders === 0) insights.push(`${cartLeader.source} מוסיף לעגלה הכי הרבה אך לא ממיר — בדוק ש${cartLeader.source} יש checkout friction`)
  }

  return NextResponse.json({
    days,
    sources: results,
    insights,
    totalRevenue: Math.round(results.reduce((s, r) => s + r.revenue, 0) / 100),
    totalOrders: results.reduce((s, r) => s + r.orders, 0),
    totalVisitors: results.reduce((s, r) => s + r.visitors, 0),
  })
})
