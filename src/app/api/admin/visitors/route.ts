import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
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
    sessionSummaries,
    returningVisitorIds,
    paidOrderCount,
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
          ip: { $first: '$geo.ip' },
          isp: { $first: '$geo.isp' },
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
    // Per-session summaries for bounce/duration/dropoff (last 7 days)
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      { $sort: { createdAt: 1 } },
      { $group: {
          _id: '$sessionId',
          visitorId:    { $first: '$visitorId' },
          eventCount:   { $sum: 1 },
          events:       { $push: '$event' },
          firstEvent:   { $first: '$event' },
          lastEvent:    { $last: '$event' },
          firstSeen:    { $min: '$createdAt' },
          lastSeen:     { $max: '$createdAt' },
          maxScroll:    { $max: '$scroll' },
      }},
    ]),
    // Returning visitor IDs (appear in >1 session during last 30 days)
    VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      { $group: { _id: '$visitorId', sessions: { $addToSet: '$sessionId' } } },
      { $match: { 'sessions.1': { $exists: true } } },
      { $project: { _id: 1 } },
    ]),
    // Real paid order count — the ONLY source of truth for purchases (parallel with VisitorEvent queries)
    Order.countDocuments({ createdAt: { $gte: last7 }, ...PAID_FILTER }),
  ])

  // Derived metrics from session summaries
  interface SessionSummary {
    _id: string
    visitorId: string
    eventCount: number
    events: string[]
    firstEvent: string
    lastEvent: string
    firstSeen: Date
    lastSeen: Date
    maxScroll: number
  }

  const sessions = sessionSummaries as SessionSummary[]
  const totalSessions = sessions.length

  // Bounce: session with only 1 distinct event type or only pageview
  const bouncedSessions = sessions.filter(s =>
    s.eventCount <= 1 || (s.eventCount <= 2 && s.events.every(e => e === 'pageview'))
  ).length
  const bounceRate = totalSessions > 0 ? +((bouncedSessions / totalSessions) * 100).toFixed(1) : 0

  // Avg session duration (seconds)
  const durations = sessions
    .map(s => (new Date(s.lastSeen).getTime() - new Date(s.firstSeen).getTime()) / 1000)
    .filter(d => d > 0 && d < 3600) // exclude outliers > 1hr
  const avgSessionDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0

  // Avg max scroll depth
  const scrollValues = sessions.filter(s => s.maxScroll > 0).map(s => s.maxScroll)
  const avgScrollDepth = scrollValues.length > 0
    ? Math.round(scrollValues.reduce((a, b) => a + b, 0) / scrollValues.length)
    : 0

  // Returning visitor %
  const returningCount = (returningVisitorIds as { _id: string }[]).length
  const returningRate = weekUnique.length > 0
    ? +((returningCount / weekUnique.length) * 100).toFixed(1)
    : 0

  // Drop-off analysis: for non-converting sessions, what was the LAST event before exit?
  const dropoffMap = new Map<string, number>()
  for (const s of sessions) {
    if (!s.events.includes('checkout_complete')) {
      const lastEv = s.lastEvent || 'unknown'
      dropoffMap.set(lastEv, (dropoffMap.get(lastEv) || 0) + 1)
    }
  }
  const dropoffByEvent = Array.from(dropoffMap.entries())
    .map(([event, count]) => ({ event, count, pct: +((count / Math.max(totalSessions, 1)) * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

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
    // New metrics
    bounceRate,
    avgSessionDuration,
    avgScrollDepth,
    returningRate,
    totalSessions,
    dropoffByEvent,
    // Purchase truth: paid Orders only — NOT checkout_complete VisitorEvents
    paidOrderCount,
  })
  } catch (err) {
    console.error('[visitors] route error:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
})
