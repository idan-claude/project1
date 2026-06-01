import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'
import { getTikTokConfig } from '@/lib/settings/credentials'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()

  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  const since7d = new Date(Date.now() - 7 * 86400000)

  const cfg = await getTikTokConfig(storeId)
  const pixelId = cfg?.pixelId || ''
  const eventsApiToken = cfg?.eventsApiToken || ''
  const eventsApiConfigured = !!(pixelId && eventsApiToken)

  const [totalPaidOrders7d, tiktokCapiFired7d, tiktokPixelFired7d] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER, 'tracking.tiktokCapiFired': true }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER, 'tracking.tiktokPixelFired': true }),
  ])

  const ttAttributed = await Order.countDocuments({
    createdAt: { $gte: since7d },
    ...PAID_FILTER,
    'attribution.ttclid': { $ne: '' },
  })

  const deliveryRate = totalPaidOrders7d > 0
    ? Math.round((tiktokCapiFired7d / totalPaidOrders7d) * 100)
    : null

  const checks = [
    {
      id: 'pixel_configured',
      name: 'TikTok Pixel מוגדר',
      status: pixelId ? 'ok' : 'error',
      detail: pixelId ? `Pixel: ${pixelId}` : 'חבר TikTok Pixel בהגדרות → חיבורים',
    },
    {
      id: 'events_api',
      name: 'TikTok Events API',
      status: eventsApiConfigured ? 'ok' : 'error',
      detail: eventsApiConfigured ? 'Pixel ID + Token מוגדרים' : 'חבר TikTok Events API בהגדרות → חיבורים',
    },
    {
      id: 'delivery',
      name: 'אחוז הגעת Events API',
      status: deliveryRate === null ? 'info' : deliveryRate >= 90 ? 'ok' : deliveryRate >= 70 ? 'warning' : 'error',
      detail: deliveryRate === null
        ? 'אין הזמנות ב-7 ימים'
        : `${tiktokCapiFired7d}/${totalPaidOrders7d} הזמנות (${deliveryRate}%)`,
    },
    {
      id: 'attribution',
      name: 'ייחוס TikTok',
      status: ttAttributed > 0 ? 'ok' : 'info',
      detail: `${ttAttributed} הזמנות עם ttclid ב-7 ימים`,
    },
  ]

  return NextResponse.json({
    pixelId,
    eventsApiConfigured,
    stats: { totalPaidOrders7d, tiktokCapiFired7d, tiktokPixelFired7d, ttAttributed, deliveryRate },
    checks,
    overallStatus: checks.some(c => c.status === 'error') ? 'error'
      : checks.some(c => c.status === 'warning') ? 'warning'
      : 'ok',
  })
})
