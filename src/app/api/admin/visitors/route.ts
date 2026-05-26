import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last7 = new Date(Date.now() - 7 * 86400000)
  const last30 = new Date(Date.now() - 30 * 86400000)

  const [
    todayEvents,
    todayUnique,
    weekEvents,
    weekUnique,
    byEventRaw,
    byDeviceRaw,
    byReferrerRaw,
    topPagesRaw,
    cartEvents,
    checkoutStarts,
    checkoutCompletes,
    byHourRaw,
    recentJourneys,
    scrollDepthRaw,
    byCountryRaw,
  ] = await Promise.all([
    VisitorEvent.countDocuments({ createdAt: { $gte: today } }),
    VisitorEvent.distinct('visitorId', { createdAt: { $gte: today } }),
    VisitorEvent.countDocuments({ createdAt: { $gte: last7 } }),
    VisitorEvent.distinct('visitorId', { createdAt: { $gte: last7 } }),
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
    ]),
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $group: { _id: '$device.type', count: { $sum: 1 } } },
    ]),
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last30 }, referrer: { $ne: '' } } },
      { $group: { _id: '$referrer', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last7 }, event: 'pageview', path: { $ne: '' } } },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    VisitorEvent.countDocuments({ event: 'add_to_cart', createdAt: { $gte: last7 } }),
    VisitorEvent.countDocuments({ event: 'checkout_start', createdAt: { $gte: last7 } }),
    VisitorEvent.countDocuments({ event: 'checkout_complete', createdAt: { $gte: last7 } }),
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Latest 20 visitor sessions for journey view
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $sort: { createdAt: 1 } },
      { $group: {
          _id: '$sessionId',
          visitorId: { $first: '$visitorId' },
          events: { $push: { event: '$event', path: '$path', scroll: '$scroll', createdAt: '$createdAt', meta: '$meta' } },
          device: { $first: '$device.type' },
          country: { $first: '$geo.country' },
          city: { $first: '$geo.city' },
          language: { $first: '$language' },
          firstSeen: { $min: '$createdAt' },
          lastSeen: { $max: '$createdAt' },
      }},
      { $sort: { lastSeen: -1 } },
      { $limit: 20 },
    ]),
    // Average scroll depth by path
    VisitorEvent.aggregate([
      { $match: { event: 'scroll_depth', createdAt: { $gte: last7 }, scroll: { $gt: 0 } } },
      { $group: { _id: '$path', avgScroll: { $avg: '$scroll' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    // Top countries
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last7 }, 'geo.country': { $ne: '' } } },
      { $group: { _id: '$geo.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ])

  return NextResponse.json({
    totalToday: todayEvents,
    uniqueVisitorsToday: todayUnique.length,
    totalWeek: weekEvents,
    uniqueVisitorsWeek: weekUnique.length,
    byEvent: Object.fromEntries(byEventRaw.map((e: { _id: string; count: number }) => [e._id, e.count])),
    byDevice: Object.fromEntries(byDeviceRaw.map((d: { _id: string; count: number }) => [d._id, d.count])),
    topReferrers: byReferrerRaw.map((r: { _id: string; count: number }) => ({ referrer: r._id, count: r.count })),
    topPages: topPagesRaw.map((p: { _id: string; count: number }) => ({ path: p._id, count: p.count })),
    cartEvents,
    checkoutStarts,
    checkoutCompletes,
    byHour: byHourRaw.map((h: { _id: number; count: number }) => ({ hour: h._id, count: h.count })),
    recentJourneys,
    scrollDepth: scrollDepthRaw.map((s: { _id: string; avgScroll: number; count: number }) => ({
      path: s._id, avgScroll: Math.round(s.avgScroll), count: s.count,
    })),
    byCountry: byCountryRaw.map((c: { _id: string; count: number }) => ({ country: c._id, count: c.count })),
  })
})
