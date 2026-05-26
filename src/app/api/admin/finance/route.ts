import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

const PAID_FILTER = { 'payment.status': 'paid', testMode: { $ne: true } }

export const GET = withAdminAuth(async () => {
  await connectDB()
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [todayData, monthData, lastMonthData, byDay, byStatus] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, ...PAID_FILTER } },
      { $group: { _id: null, revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, ...PAID_FILTER } },
      { $group: { _id: null, revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, ...PAID_FILTER } },
      { $group: { _id: null, revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ]),
    // Revenue by day for last 30 days — paid, non-test orders only
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) }, ...PAID_FILTER } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Orders by status (status breakdown for pipeline visibility, not revenue)
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
    ]),
  ])

  return NextResponse.json({
    today: { revenue: todayData[0]?.revenue ?? 0, orders: todayData[0]?.count ?? 0 },
    month: { revenue: monthData[0]?.revenue ?? 0, orders: monthData[0]?.count ?? 0 },
    lastMonth: { revenue: lastMonthData[0]?.revenue ?? 0, orders: lastMonthData[0]?.count ?? 0 },
    byDay,
    byStatus,
  })
})
