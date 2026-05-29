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
    // Return recent visitors — one row per visitorId, most recent canonical IP
    const recentVisitors = await VisitorEvent.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      { $sort: { createdAt: -1 } },  // most-recent first so $first gives latest value
      { $group: {
          _id: '$visitorId',
          ip: { $first: '$geo.ip' },
          sessionCount: { $addToSet: '$sessionId' },
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

    const ips = recentVisitors.map((r: { ip: string }) => r.ip).filter(Boolean)
    const blocks = await IpBlock.find({ ip: { $in: ips } }).lean()
    const blockMap = new Map(blocks.map(b => [b.ip, b.type]))

    return NextResponse.json({
      visitors: recentVisitors.map((r: {
        _id: string; ip: string; sessionCount: string[]; eventCount: number
        lastSeen: Date; firstSeen: Date; country: string; city: string; device: string; events: string[]
      }) => ({
        ip: r.ip || '',
        sessions: r.sessionCount.length,
        visitors: 1,
        events: r.eventCount,
        lastSeen: r.lastSeen,
        firstSeen: r.firstSeen,
        country: r.country,
        city: r.city,
        device: r.device,
        blockStatus: blockMap.get(r.ip) || null,
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
