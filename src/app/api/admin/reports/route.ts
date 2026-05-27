import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month' // 'week' | 'month'

    const now = new Date()
    const buckets = period === 'week' ? 4 : 6

    // Build date buckets
    const results: { label: string; revenue: number; orders: number }[] = []

    for (let i = buckets - 1; i >= 0; i--) {
      let start: Date, end: Date, label: string

      if (period === 'week') {
        // Last N weeks
        end = new Date(now)
        end.setDate(now.getDate() - i * 7)
        start = new Date(end)
        start.setDate(end.getDate() - 7)
        label = `שבוע ${buckets - i}`
      } else {
        // Last N months
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        start = d
        end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
        label = d.toLocaleDateString('he-IL', { month: 'short' })
      }

      const agg = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, ...PAID_FILTER } },
        { $group: { _id: null, revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
      ])

      results.push({
        label,
        revenue: agg[0]?.revenue ?? 0,
        orders: agg[0]?.count ?? 0,
      })
    }

    // Top products (all time)
    const topProducts = await Order.aggregate([
      { $match: { ...PAID_FILTER } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.nameHe',
          units: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ])

    // Overall totals
    const totals = await Order.aggregate([
      { $match: { ...PAID_FILTER } },
      { $group: { _id: null, revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ])

    return NextResponse.json({
      buckets: results,
      topProducts,
      totalRevenue: totals[0]?.revenue ?? 0,
      totalOrders: totals[0]?.count ?? 0,
    })
  } catch (err) {
    console.error('[GET /api/admin/reports]', err)
    return NextResponse.json({ buckets: [], topProducts: [], totalRevenue: 0, totalOrders: 0 }, { status: 500 })
  }
})
