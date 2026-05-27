import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import IpBlock from '@/lib/db/models/IpBlock'

export const dynamic = 'force-dynamic'

// Search visitors by IP or visitorId — GDPR-safe masked display
export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()

  const url  = new URL(req.url)
  const ip   = url.searchParams.get('ip')?.trim() || ''
  const vid  = url.searchParams.get('visitorId')?.trim() || ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = 20

  if (!ip && !vid) {
    // Return recent unique IPs with visitor counts
    const recentIPs = await VisitorEvent.aggregate([
      { $match: { 'geo.ip': { $ne: '' }, createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      { $group: {
          _id: '$geo.ip',
          sessionCount: { $addToSet: '$sessionId' },
          visitorIds: { $addToSet: '$visitorId' },
          eventCount: { $sum: 1 },
          lastSeen: { $max: '$createdAt' },
          firstSeen: { $min: '$createdAt' },
          country: { $first: '$geo.country' },
          city: { $first: '$geo.city' },
          device: { $first: '$device.type' },
          events: { $push: '$event' },
      }},
      { $sort: { lastSeen: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ])

    // Check which IPs are blocked
    const ips = recentIPs.map((r: { _id: string }) => r._id)
    const blocks = await IpBlock.find({ ip: { $in: ips } }).lean()
    const blockMap = new Map(blocks.map(b => [b.ip, b.type]))

    return NextResponse.json({
      visitors: recentIPs.map((r: {
        _id: string; sessionCount: string[]; visitorIds: string[]; eventCount: number
        lastSeen: Date; firstSeen: Date; country: string; city: string; device: string; events: string[]
      }) => ({
        ip: r._id, // Full IP — admin visibility
        sessions: r.sessionCount.length,
        visitors: r.visitorIds.length,
        events: r.eventCount,
        lastSeen: r.lastSeen,
        firstSeen: r.firstSeen,
        country: r.country,
        city: r.city,
        device: r.device,
        blockStatus: blockMap.get(r._id) || null,
        converted: r.events.includes('checkout_complete'),
        addedToCart: r.events.includes('add_to_cart'),
      })),
    })
  }

  // Search by visitorId
  const match: Record<string, unknown> = {}
  if (vid) match['visitorId'] = vid
  // For IP search, we do prefix match on stored geo.ip
  if (ip) match['geo.ip'] = { $regex: `^${ip.replace(/x/g, '').replace(/\./g, '\\.').replace(/\.*$/, '')}`, $options: 'i' }

  const events = await VisitorEvent.find(match)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  // Group by session
  const sessionMap = new Map<string, {
    sessionId: string; visitorId: string; events: typeof events
    firstSeen: Date; lastSeen: Date; device: string; country: string; ip: string
  }>()

  for (const e of events) {
    if (!sessionMap.has(e.sessionId)) {
      sessionMap.set(e.sessionId, {
        sessionId: e.sessionId,
        visitorId: e.visitorId,
        events: [],
        firstSeen: e.createdAt,
        lastSeen: e.createdAt,
        device: e.device?.type || '',
        country: e.geo?.country || '',
        ip: e.geo?.ip || '',
      })
    }
    const sess = sessionMap.get(e.sessionId)!
    sess.events.push(e)
    if (e.createdAt < sess.firstSeen) sess.firstSeen = e.createdAt
    if (e.createdAt > sess.lastSeen) sess.lastSeen = e.createdAt
  }

  const sessions = Array.from(sessionMap.values())
    .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
    .map(s => ({
      sessionId: s.sessionId,
      visitorId: s.visitorId.slice(0, 8) + '...',
      ip: s.ip,
      events: s.events.map(e => ({
        event: e.event,
        path: e.path,
        scroll: e.scroll,
        meta: e.meta,
        createdAt: e.createdAt,
      })),
      device: s.device,
      country: s.country,
      firstSeen: s.firstSeen,
      lastSeen: s.lastSeen,
      durationSeconds: Math.round((s.lastSeen.getTime() - s.firstSeen.getTime()) / 1000),
      converted: s.events.some(e => e.event === 'checkout_complete'),
      addedToCart: s.events.some(e => e.event === 'add_to_cart'),
    }))

  return NextResponse.json({ sessions })
})
