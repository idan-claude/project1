import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import User from '@/lib/db/models/User'
import Product from '@/lib/db/models/Product'
import VisitorEvent from '@/lib/db/models/VisitorEvent'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    ordersToday,
    ordersThisMonth,
    openOrders,
    totalCustomers,
    newCustomersToday,
    recentOrders,
    lowStockProducts,
    avgOrderValue,
    productViewSessions,
    cartSessions,
    paidOrders30d,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: firstOfMonth }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ status: { $in: ['new', 'processing'] } }),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: today } }),
    Order.find().sort({ createdAt: -1 }).limit(10),
    Product.find({
      'inventory.trackQuantity': true,
      $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] },
    }).select('nameHe inventory.quantity inventory.lowStockThreshold slug'),
    Order.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, avg: { $avg: '$pricing.total' } } },
    ]),
    // Unique sessions that viewed the product page in last 30 days
    VisitorEvent.distinct('sessionId', { event: 'product_view', createdAt: { $gte: thirtyDaysAgo } }),
    // Unique sessions that added to cart in last 30 days
    VisitorEvent.distinct('sessionId', { event: 'add_to_cart', createdAt: { $gte: thirtyDaysAgo } }),
    // Paid orders in last 30 days
    Order.countDocuments({ 'payment.status': 'paid', createdAt: { $gte: thirtyDaysAgo } }),
  ])

  const productViews = productViewSessions.length
  const cartAdds = cartSessions.length
  const conversionRate = productViews > 0 ? Math.round((paidOrders30d / productViews) * 1000) / 10 : 0
  const cartRate = productViews > 0 ? Math.round((cartAdds / productViews) * 1000) / 10 : 0

  return NextResponse.json({
    revenueToday: ordersToday[0]?.total ?? 0,
    orderCountToday: ordersToday[0]?.count ?? 0,
    revenueMonth: ordersThisMonth[0]?.total ?? 0,
    orderCountMonth: ordersThisMonth[0]?.count ?? 0,
    openOrders,
    totalCustomers,
    newCustomersToday: newCustomersToday ?? 0,
    avgOrderValue: Math.round(avgOrderValue[0]?.avg ?? 0),
    conversionRate,
    cartRate,
    recentOrders,
    lowStockProducts,
  })
})
