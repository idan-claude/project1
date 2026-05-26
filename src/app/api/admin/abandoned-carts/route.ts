import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()

  const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Sessions that had add_to_cart but no checkout_complete in last 7 days
  const cartSessions = await VisitorEvent.aggregate([
    { $match: { createdAt: { $gte: d7 } } },
    { $sort: { sessionId: 1, createdAt: 1 } },
    {
      $group: {
        _id: '$sessionId',
        visitorId: { $first: '$visitorId' },
        events: { $push: '$event' },
        lastPath: { $last: '$path' },
        device: { $first: '$device' },
        lastSeen: { $last: '$createdAt' },
        firstSeen: { $first: '$createdAt' },
      },
    },
    {
      $match: {
        events: { $in: ['add_to_cart'] },
        $expr: {
          $not: { $in: ['checkout_complete', '$events'] },
        },
      },
    },
    { $sort: { lastSeen: -1 } },
    { $limit: 50 },
  ])

  // Stats
  const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [totalAbandoned, totalOrders] = await Promise.all([
    VisitorEvent.aggregate([
      { $match: { event: 'add_to_cart', createdAt: { $gte: d30 } } },
      { $group: { _id: '$sessionId' } },
      { $count: 'count' },
    ]).then(r => r[0]?.count || 0),
    Order.countDocuments({ createdAt: { $gte: d30 }, 'payment.status': 'paid', testMode: { $ne: true } }),
  ])

  const abandonRate = totalAbandoned > 0
    ? Math.round(((totalAbandoned - totalOrders) / totalAbandoned) * 100)
    : 0

  return NextResponse.json({
    carts: cartSessions.map(s => ({
      sessionId: s._id,
      visitorId: s.visitorId,
      lastSeen: s.lastSeen,
      firstSeen: s.firstSeen,
      device: s.device?.type || 'unknown',
      lastPath: s.lastPath,
      eventCount: s.events.length,
    })),
    stats: {
      totalAbandoned7d: cartSessions.length,
      totalAbandoned30d: totalAbandoned,
      abandonRate,
      totalOrders30d: totalOrders,
    },
  })
})
