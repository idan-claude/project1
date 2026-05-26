import Order from '@/lib/db/models/Order'

// The ONE filter for real purchases. Never use VisitorEvent counts as purchases.
export const PAID_FILTER = {
  'payment.status': 'paid',
  testMode: { $ne: true },
} as const

export async function getPaidOrderCount(since: Date): Promise<number> {
  return Order.countDocuments({ createdAt: { $gte: since }, ...PAID_FILTER })
}

export async function getRevenue(since: Date): Promise<{ total: number; count: number }> {
  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, ...PAID_FILTER } },
    { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } },
  ])
  return { total: result[0]?.total ?? 0, count: result[0]?.count ?? 0 }
}

// Conversion rate is ONLY computed from real paid orders, never from checkout_complete events.
export function computeConversionRate(paidOrders: number, visitors: number): number {
  if (paidOrders === 0 || visitors === 0) return 0
  return Math.round((paidOrders / visitors) * 1000) / 10
}
