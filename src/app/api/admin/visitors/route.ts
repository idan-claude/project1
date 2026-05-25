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
    todayVisitors,
    weekVisitors,
    byEvent,
    byDevice,
    byReferrer,
    topPages,
    cartEvents,
    checkoutAttempts,
  ] = await Promise.all([
    VisitorEvent.distinct('sessionId', { createdAt: { $gte: today } }),
    VisitorEvent.distinct('sessionId', { createdAt: { $gte: last7 } }),
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
      { $group: { _id: '$path', views: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
      { $project: { path: '$_id', views: 1, sessions: { $size: '$sessions' } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
    VisitorEvent.countDocuments({ event: 'add_to_cart', createdAt: { $gte: last7 } }),
    VisitorEvent.countDocuments({ event: 'checkout_start', createdAt: { $gte: last7 } }),
  ])

  return NextResponse.json({
    today: todayVisitors.length,
    week: weekVisitors.length,
    byEvent,
    byDevice,
    byReferrer,
    topPages,
    cartEvents,
    checkoutAttempts,
  })
})
