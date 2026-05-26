import Order from '@/lib/db/models/Order'
import VisitorEvent from '@/lib/db/models/VisitorEvent'

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

export interface ConsistencyReport {
  ok: boolean
  checkedAt: string
  paidOrders7d: number
  paidOrders30d: number
  checkoutCompleteEvents7d: number
  // These must always be equal (same time window, same filter):
  // paidOrders7d from dashboard == paidOrders7d from visitors API
  warnings: string[]
}

// Runtime cross-validation: detects if behavioral events are leaking into purchase counts.
// Call from /api/admin/analytics/consistency or from health monitor.
export async function validateAnalyticsConsistency(): Promise<ConsistencyReport> {
  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 86400000)
  const since30d = new Date(now.getTime() - 30 * 86400000)

  const [paidOrders7d, paidOrders30d, checkoutCompleteEvents7d] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: since30d }, ...PAID_FILTER }),
    VisitorEvent.countDocuments({ event: 'checkout_complete', createdAt: { $gte: since7d } }),
  ])

  const warnings: string[] = []

  // A checkout_complete VisitorEvent is behavioral — reaching the thank-you page.
  // It does NOT guarantee payment was captured. Flag if someone might confuse these.
  if (checkoutCompleteEvents7d > paidOrders7d) {
    warnings.push(
      `${checkoutCompleteEvents7d} checkout_complete events vs ${paidOrders7d} paid orders (last 7d). ` +
      `Behavioral events exceed paid orders — ensure no page uses checkout_complete as a purchase metric.`
    )
  }

  if (paidOrders7d > checkoutCompleteEvents7d && checkoutCompleteEvents7d > 0) {
    warnings.push(
      `${paidOrders7d} paid orders exceed ${checkoutCompleteEvents7d} checkout_complete events (last 7d). ` +
      `Possible tracking gap — checkout_complete event may not fire on all conversions.`
    )
  }

  return {
    ok: warnings.length === 0,
    checkedAt: now.toISOString(),
    paidOrders7d,
    paidOrders30d,
    checkoutCompleteEvents7d,
    warnings,
  }
}
