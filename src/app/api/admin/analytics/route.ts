import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin/withAdminAuth'
import dbConnect from '@/lib/db/dbConnect'
import Order from '@/lib/db/models/Order'
import Product from '@/lib/db/models/Product'

export const GET = withAdminAuth(async () => {
  await dbConnect()

  const [
    totalStats,
    last7days,
    last30days,
    topProducts,
    conversionByHour,
  ] = await Promise.all([
    // All-time totals
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          totalOrders: { $sum: 1 },
          avgOrder: { $avg: '$pricing.total' },
          uniqueCustomers: { $addToSet: '$customer.email' },
        },
      },
    ]),
    // Last 7 days by day
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Last 30 days by day
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Top products by revenue
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.nameHe' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          units: { $sum: '$items.quantity' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    // Orders by hour of day (to find peak hours)
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  const stats = totalStats[0] ?? {}

  return NextResponse.json({
    totals: {
      revenue: stats.totalRevenue ?? 0,
      orders: stats.totalOrders ?? 0,
      avgOrder: Math.round(stats.avgOrder ?? 0),
      uniqueCustomers: stats.uniqueCustomers?.length ?? 0,
    },
    last7days,
    last30days,
    topProducts,
    conversionByHour,
  })
})
