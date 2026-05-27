import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()

  const since7d = new Date(Date.now() - 7 * 86400000)

  const pixelId = process.env.TIKTOK_PIXEL_ID || ''
  const eventsApiToken = process.env.TIKTOK_EVENTS_API_TOKEN || ''

  const pixelConfigured = !!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
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
      status: pixelConfigured ? 'ok' : 'error',
      detail: pixelConfigured ? `Pixel: ${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}` : 'חסר NEXT_PUBLIC_TIKTOK_PIXEL_ID',
    },
    {
      id: 'events_api',
      name: 'TikTok Events API',
      status: eventsApiConfigured ? 'ok' : 'error',
      detail: eventsApiConfigured ? 'Pixel ID + Token מוגדרים' : 'חסר TIKTOK_PIXEL_ID או TIKTOK_EVENTS_API_TOKEN',
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
    pixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '',
    eventsApiConfigured,
    stats: { totalPaidOrders7d, tiktokCapiFired7d, tiktokPixelFired7d, ttAttributed, deliveryRate },
    checks,
    overallStatus: checks.some(c => c.status === 'error') ? 'error'
      : checks.some(c => c.status === 'warning') ? 'warning'
      : 'ok',
  })
})
