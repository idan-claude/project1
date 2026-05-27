import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()

  const since7d = new Date(Date.now() - 7 * 86400000)

  const pixelId = process.env.META_PIXEL_ID || ''
  const capiToken = process.env.META_CAPI_TOKEN || ''
  const testCode = process.env.META_CAPI_TEST_CODE || ''

  const pixelConfigured = !!pixelId
  const capiConfigured = !!(pixelId && capiToken)

  // Fetch order tracking stats
  const [
    totalPaidOrders7d,
    metaCapiFired7d,
    metaPixelFired7d,
    capiFailedOrders,
    attributedOrders,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER, 'tracking.metaCapiFired': true }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER, 'tracking.metaPixelFired': true }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER, 'tracking.metaCapiFired': false }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER, 'attribution.source': { $ne: '' } }),
  ])

  // Attribution breakdown for paid orders last 7d
  const attributionBreakdown = await Order.aggregate([
    { $match: { createdAt: { $gte: since7d }, ...PAID_FILTER } },
    { $group: {
        _id: '$attribution.source',
        count: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
    }},
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ])

  // Deduplication health: orders with event_id set
  const withEventId = await Order.countDocuments({
    createdAt: { $gte: since7d },
    ...PAID_FILTER,
    'tracking.metaEventId': { $ne: '' },
  })

  const capiDeliveryRate = totalPaidOrders7d > 0
    ? Math.round((metaCapiFired7d / totalPaidOrders7d) * 100)
    : null

  const dedupRate = totalPaidOrders7d > 0
    ? Math.round((withEventId / totalPaidOrders7d) * 100)
    : null

  const checks = [
    {
      id: 'pixel_configured',
      name: 'Meta Pixel מוגדר',
      status: pixelConfigured ? 'ok' : 'error',
      detail: pixelConfigured ? `Pixel ID: ${pixelId}` : 'חסר NEXT_PUBLIC_META_PIXEL_ID',
    },
    {
      id: 'capi_configured',
      name: 'Conversions API מוגדר',
      status: capiConfigured ? 'ok' : 'error',
      detail: capiConfigured ? 'Pixel ID + Token מוגדרים' : 'חסר META_PIXEL_ID או META_CAPI_TOKEN',
    },
    {
      id: 'test_mode',
      name: 'מצב בדיקה',
      status: testCode ? 'warning' : 'ok',
      detail: testCode ? `Test code פעיל: ${testCode}` : 'Production mode',
    },
    {
      id: 'capi_delivery',
      name: 'אחוז הגעת CAPI',
      status: capiDeliveryRate === null ? 'info' : capiDeliveryRate >= 90 ? 'ok' : capiDeliveryRate >= 70 ? 'warning' : 'error',
      detail: capiDeliveryRate === null
        ? 'אין הזמנות ב-7 ימים האחרונים'
        : `${metaCapiFired7d} מתוך ${totalPaidOrders7d} הזמנות (${capiDeliveryRate}%)`,
    },
    {
      id: 'dedup_health',
      name: 'בריאות כפילויות',
      status: dedupRate === null ? 'info' : dedupRate >= 90 ? 'ok' : dedupRate >= 70 ? 'warning' : 'error',
      detail: dedupRate === null
        ? 'אין נתונים'
        : `${withEventId} מתוך ${totalPaidOrders7d} הזמנות עם event_id (${dedupRate}%)`,
    },
    {
      id: 'failed_events',
      name: 'אירועים שנכשלו',
      status: capiFailedOrders === 0 ? 'ok' : capiFailedOrders <= 2 ? 'warning' : 'error',
      detail: `${capiFailedOrders} הזמנות ללא CAPI ב-7 ימים`,
    },
  ]

  return NextResponse.json({
    pixelId,
    capiConfigured,
    testMode: !!testCode,
    stats: {
      totalPaidOrders7d,
      metaCapiFired7d,
      metaPixelFired7d,
      capiFailedOrders,
      attributedOrders,
      capiDeliveryRate,
      dedupRate,
    },
    attributionBreakdown: attributionBreakdown.map(r => ({
      source: r._id || 'direct',
      orders: r.count,
      revenue: r.revenue,
    })),
    checks,
    overallStatus: checks.some(c => c.status === 'error') ? 'error'
      : checks.some(c => c.status === 'warning') ? 'warning'
      : 'ok',
  })
})
