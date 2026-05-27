import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'

export const dynamic = 'force-dynamic'

// Fraud scoring: rule-based, computed from real VisitorEvent data only.
// Score 0-100: 0-30 clean, 31-60 watch, 61+ suspicious
export const GET = withAdminAuth(async () => {
  await connectDB()

  const last24h = new Date(Date.now() - 86400000)
  const last7   = new Date(Date.now() - 7 * 86400000)

  // Per-IP aggregation for fraud signals
  const ipStats = await VisitorEvent.aggregate([
    { $match: { createdAt: { $gte: last7 }, 'geo.ip': { $ne: '' } } },
    { $group: {
        _id: '$geo.ip',
        sessions: { $addToSet: '$sessionId' },
        visitors: { $addToSet: '$visitorId' },
        events: { $push: '$event' },
        rageClicks: { $sum: { $cond: [{ $eq: ['$event', 'rage_click'] }, 1, 0] } },
        checkoutStarts: { $sum: { $cond: [{ $eq: ['$event', 'checkout_start'] }, 1, 0] } },
        purchases: { $sum: { $cond: [{ $eq: ['$event', 'checkout_complete'] }, 1, 0] } },
        lastSeen: { $max: '$createdAt' },
        country: { $first: '$geo.country' },
        city: { $first: '$geo.city' },
    }},
    { $match: { $or: [
      { rageClicks: { $gte: 2 } },
      { checkoutStarts: { $gte: 3 } },
    ]}},
    { $sort: { lastSeen: -1 } },
    { $limit: 50 },
  ])

  // Per-session for repeat-checkout-without-purchase detection
  const sessionStats = await VisitorEvent.aggregate([
    { $match: { createdAt: { $gte: last24h }, event: { $in: ['checkout_start', 'checkout_complete', 'rage_click'] } } },
    { $group: {
        _id: '$sessionId',
        visitorId: { $first: '$visitorId' },
        ip: { $first: '$geo.ip' },
        country: { $first: '$geo.country' },
        events: { $push: '$event' },
        lastSeen: { $max: '$createdAt' },
        device: { $first: '$device.type' },
    }},
    { $addFields: {
        checkoutStarts: { $size: { $filter: { input: '$events', cond: { $eq: ['$$this', 'checkout_start'] } } } },
        purchases: { $size: { $filter: { input: '$events', cond: { $eq: ['$$this', 'checkout_complete'] } } } },
        rageClicks: { $size: { $filter: { input: '$events', cond: { $eq: ['$$this', 'rage_click'] } } } },
    }},
    { $match: { $or: [{ checkoutStarts: { $gte: 2 } }, { rageClicks: { $gte: 3 } }] } },
    { $sort: { lastSeen: -1 } },
    { $limit: 30 },
  ])

  interface IpStat {
    _id: string
    sessions: string[]
    visitors: string[]
    events: string[]
    rageClicks: number
    checkoutStarts: number
    purchases: number
    lastSeen: Date
    country: string
    city: string
  }

  interface SessionStat {
    _id: string
    visitorId: string
    ip: string
    country: string
    events: string[]
    lastSeen: Date
    device: string
    checkoutStarts: number
    purchases: number
    rageClicks: number
  }

  function fraudScore(rageClicks: number, checkoutStarts: number, purchases: number): number {
    let score = 0
    score += Math.min(rageClicks * 15, 40)
    const abandonedCheckouts = checkoutStarts - purchases
    score += Math.min(abandonedCheckouts * 12, 40)
    if (checkoutStarts >= 5) score += 20
    return Math.min(score, 100)
  }

  const suspiciousIps = ipStats.map((s: IpStat) => ({
    ip: s._id,
    sessions: s.sessions.length,
    visitors: s.visitors.length,
    rageClicks: s.rageClicks,
    checkoutStarts: s.checkoutStarts,
    purchases: s.purchases,
    lastSeen: s.lastSeen,
    country: s.country,
    city: s.city,
    fraudScore: fraudScore(s.rageClicks, s.checkoutStarts, s.purchases),
    signals: [
      ...(s.rageClicks >= 2 ? [`${s.rageClicks} rage clicks`] : []),
      ...(s.checkoutStarts >= 3 ? [`${s.checkoutStarts} checkout attempts`] : []),
      ...((s.checkoutStarts - s.purchases) >= 3 ? [`${s.checkoutStarts - s.purchases} abandoned checkouts`] : []),
    ],
  })).sort((a, b) => b.fraudScore - a.fraudScore)

  const suspiciousSessions = sessionStats.map((s: SessionStat) => ({
    sessionId: s._id.slice(0, 8) + '...',
    visitorId: s.visitorId.slice(0, 8) + '...',
    ip: maskIpDisplay(s.ip || ''),
    country: s.country,
    device: s.device,
    checkoutStarts: s.checkoutStarts,
    purchases: s.purchases,
    rageClicks: s.rageClicks,
    lastSeen: s.lastSeen,
    fraudScore: fraudScore(s.rageClicks, s.checkoutStarts, s.purchases),
    signals: [
      ...(s.rageClicks >= 3 ? [`rage clicks: ${s.rageClicks}`] : []),
      ...(s.checkoutStarts >= 2 && s.purchases === 0 ? [`${s.checkoutStarts}x checkout abandoned`] : []),
    ],
  })).sort((a, b) => b.fraudScore - a.fraudScore)

  return NextResponse.json({
    suspiciousIps,
    suspiciousSessions,
    totalFlagged: suspiciousIps.length + suspiciousSessions.length,
  })
})
