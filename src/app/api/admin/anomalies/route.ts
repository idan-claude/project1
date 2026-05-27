import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

interface Anomaly {
  id: string
  level: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  metric?: string
  timestamp: Date
}

export const GET = withAdminAuth(async () => {
  await connectDB()

  const now = new Date()
  const since24h = new Date(now.getTime() - 86400000)
  const prev24h  = new Date(now.getTime() - 2 * 86400000)
  const since1h  = new Date(now.getTime() - 3600000)
  const prev1h   = new Date(now.getTime() - 2 * 3600000)
  const since7d  = new Date(now.getTime() - 7 * 86400000)
  const prev7d   = new Date(now.getTime() - 14 * 86400000)

  const [
    visitors24h, visitorsPrev24h,
    visitors1h, visitorsPrev1h,
    orders24h, ordersPrev24h,
    orders7d, ordersPrev7d,
    checkoutStarts24h, checkoutCompletes24h,
    rageClicks24h,
    ordersWithoutTracking,
  ] = await Promise.all([
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: since24h } }),
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: prev24h, $lt: since24h } }),
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: since1h } }),
    VisitorEvent.distinct('visitorId', { event: 'pageview', createdAt: { $gte: prev1h, $lt: since1h } }),
    Order.countDocuments({ createdAt: { $gte: since24h }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: prev24h, $lt: since24h }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: since7d }, ...PAID_FILTER }),
    Order.countDocuments({ createdAt: { $gte: prev7d, $lt: since7d }, ...PAID_FILTER }),
    VisitorEvent.countDocuments({ event: 'checkout_start', createdAt: { $gte: since24h } }),
    VisitorEvent.countDocuments({ event: 'checkout_complete', createdAt: { $gte: since24h } }),
    VisitorEvent.countDocuments({ event: 'rage_click', createdAt: { $gte: since24h } }),
    Order.countDocuments({ createdAt: { $gte: since24h }, ...PAID_FILTER, 'tracking.metaCapiFired': false, 'tracking.metaEventId': '' }),
  ])

  const anomalies: Anomaly[] = []

  // Traffic drop detection
  const trafficDrop24h = visitorsPrev24h.length > 5
    ? Math.round(((visitors24h.length - visitorsPrev24h.length) / visitorsPrev24h.length) * 100)
    : null

  if (trafficDrop24h !== null && trafficDrop24h <= -40) {
    anomalies.push({
      id: 'traffic_drop_24h',
      level: 'critical',
      title: 'ירידה חדה בתנועה',
      detail: `${Math.abs(trafficDrop24h)}% פחות מבקרים ב-24 שעות (${visitors24h.length} היום vs ${visitorsPrev24h.length} אתמול)`,
      metric: `${trafficDrop24h}%`,
      timestamp: now,
    })
  } else if (trafficDrop24h !== null && trafficDrop24h <= -20) {
    anomalies.push({
      id: 'traffic_drop_24h',
      level: 'warning',
      title: 'ירידה בתנועה',
      detail: `${Math.abs(trafficDrop24h)}% פחות מבקרים ב-24 שעות`,
      metric: `${trafficDrop24h}%`,
      timestamp: now,
    })
  }

  // Hourly traffic drop
  const trafficDrop1h = visitorsPrev1h.length > 2
    ? Math.round(((visitors1h.length - visitorsPrev1h.length) / visitorsPrev1h.length) * 100)
    : null

  if (trafficDrop1h !== null && trafficDrop1h <= -60) {
    anomalies.push({
      id: 'traffic_drop_1h',
      level: 'critical',
      title: 'נפילת תנועה חדה בשעה האחרונה',
      detail: `${Math.abs(trafficDrop1h)}% ירידה — בדוק tracking וזמינות אתר`,
      metric: `${trafficDrop1h}%`,
      timestamp: now,
    })
  }

  // Conversion drop
  const conversionNow = visitors24h.length > 0 ? orders24h / visitors24h.length : 0
  const conversionPrev = visitorsPrev24h.length > 0 ? ordersPrev24h / visitorsPrev24h.length : 0
  if (conversionPrev > 0.005 && conversionNow < conversionPrev * 0.5) {
    anomalies.push({
      id: 'conversion_drop',
      level: 'warning',
      title: 'ירידה בשיעור המרה',
      detail: `המרה ירדה ל-${(conversionNow * 100).toFixed(2)}% (היה ${(conversionPrev * 100).toFixed(2)}%)`,
      timestamp: now,
    })
  }

  // High cart abandonment
  const abandonRate = checkoutStarts24h > 0
    ? Math.round(((checkoutStarts24h - orders24h) / checkoutStarts24h) * 100)
    : null

  if (abandonRate !== null && abandonRate >= 90 && checkoutStarts24h >= 3) {
    anomalies.push({
      id: 'high_abandonment',
      level: 'warning',
      title: 'נטישת checkout גבוהה',
      detail: `${abandonRate}% מהמשתמשים התחילו checkout אך לא רכשו (${checkoutStarts24h} התחלות, ${orders24h} רכישות)`,
      metric: `${abandonRate}%`,
      timestamp: now,
    })
  }

  // Rage clicks spike
  const rageClicks7dAvg = await VisitorEvent.countDocuments({ event: 'rage_click', createdAt: { $gte: since7d } })
  const rageAvgPerDay = rageClicks7dAvg / 7
  if (rageClicks24h > rageAvgPerDay * 3 && rageClicks24h > 5) {
    anomalies.push({
      id: 'rage_click_spike',
      level: 'warning',
      title: 'עלייה ב-Rage Clicks',
      detail: `${rageClicks24h} rage clicks ב-24 שעות (ממוצע: ${Math.round(rageAvgPerDay)}/יום)`,
      metric: `×${Math.round(rageClicks24h / Math.max(rageAvgPerDay, 1))}`,
      timestamp: now,
    })
  }

  // Weekly order drop
  if (ordersPrev7d > 2) {
    const weeklyDrop = Math.round(((orders7d - ordersPrev7d) / ordersPrev7d) * 100)
    if (weeklyDrop <= -50) {
      anomalies.push({
        id: 'weekly_order_drop',
        level: 'critical',
        title: 'ירידה חדה בהזמנות שבועי',
        detail: `${Math.abs(weeklyDrop)}% פחות הזמנות — ${orders7d} השבוע vs ${ordersPrev7d} בשבוע שעבר`,
        metric: `${weeklyDrop}%`,
        timestamp: now,
      })
    }
  }

  // Missing tracking pixels on recent orders
  if (ordersWithoutTracking > 0) {
    anomalies.push({
      id: 'missing_tracking',
      level: 'warning',
      title: 'הזמנות ללא מעקב Pixel',
      detail: `${ordersWithoutTracking} הזמנות ב-24 שעות לא קיבלו Meta CAPI — בדוק אינטגרציה`,
      metric: `${ordersWithoutTracking}`,
      timestamp: now,
    })
  }

  // No orders in 72h (only if we had orders recently)
  if (orders7d === 0 && ordersPrev7d > 0) {
    const lastOrder = await Order.findOne(PAID_FILTER).sort({ createdAt: -1 }).lean()
    if (lastOrder) {
      const hoursSinceOrder = Math.round((now.getTime() - lastOrder.createdAt.getTime()) / 3600000)
      if (hoursSinceOrder > 72) {
        anomalies.push({
          id: 'no_orders',
          level: 'critical',
          title: 'אין הזמנות 72+ שעות',
          detail: `הזמנה אחרונה לפני ${hoursSinceOrder} שעות — בדוק checkout ותשלום`,
          metric: `${hoursSinceOrder}h`,
          timestamp: now,
        })
      }
    }
  }

  // Sort: critical first, then warning, then by timestamp
  anomalies.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return (order[a.level] - order[b.level]) || b.timestamp.getTime() - a.timestamp.getTime()
  })

  return NextResponse.json({
    anomalies,
    summary: {
      critical: anomalies.filter(a => a.level === 'critical').length,
      warning: anomalies.filter(a => a.level === 'warning').length,
      info: anomalies.filter(a => a.level === 'info').length,
      healthy: anomalies.length === 0,
    },
    snapshot: {
      visitors24h: visitors24h.length,
      visitorsPrev24h: visitorsPrev24h.length,
      orders24h,
      checkoutStarts24h,
      rageClicks24h,
    },
  })
})
