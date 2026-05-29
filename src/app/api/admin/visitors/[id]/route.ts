import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest, ctx) => {
  const visitorId = ctx.params.id
  if (!visitorId) return NextResponse.json({ error: 'Missing visitorId' }, { status: 400 })

  try {
    await connectDB()

    const [events, orders] = await Promise.all([
      VisitorEvent.find({ visitorId }).sort({ createdAt: 1 }).lean(),
      Order.find({ 'customer.email': { $exists: true }, ...PAID_FILTER }).lean(),
    ])

    if (events.length === 0) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 })
    }

    // Session grouping
    const sessionMap = new Map<string, typeof events>()
    for (const e of events) {
      const s = sessionMap.get(e.sessionId) || []
      s.push(e)
      sessionMap.set(e.sessionId, s)
    }
    const sessions = Array.from(sessionMap.values())

    const firstSeen = events[0].createdAt
    const lastSeen = events[events.length - 1].createdAt
    const sessionCount = sessions.length

    // Engagement score (0–100)
    const eventWeights: Record<string, number> = {
      product_view: 3, add_to_cart: 15, checkout_start: 20, checkout_complete: 10,
      scroll_depth: 2, faq_open: 5, gallery_view: 4, cta_click: 12, rage_click: -5,
    }
    let rawEngagement = 0
    let rageClicks = 0
    let maxScrollPct = 0
    let productViews = 0
    let cartAdds = 0
    let checkoutStarts = 0
    let checkoutCompletes = 0
    let faqOpens = 0
    let ctaClicks = 0
    let exitPages = 0
    let totalDuration = 0

    // Track timestamps for hesitation measurement
    let firstProductViewTime: number | null = null
    let firstCartAddTime: number | null = null
    let firstCheckoutStartTime: number | null = null
    let firstCtaClickTime: number | null = null

    for (const session of sessions) {
      const sorted = [...session].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      const dur = sorted.length > 1
        ? (new Date(sorted[sorted.length - 1].createdAt).getTime() - new Date(sorted[0].createdAt).getTime()) / 1000
        : 0
      if (dur > 0 && dur < 7200) totalDuration += dur
    }

    for (const e of events) {
      rawEngagement += eventWeights[e.event] || 0
      const t = new Date(e.createdAt).getTime()
      if (e.event === 'rage_click') rageClicks++
      if (e.event === 'exit_page') exitPages++
      if (e.event === 'scroll_depth' && e.scroll > maxScrollPct) maxScrollPct = e.scroll
      if (e.event === 'product_view') {
        productViews++
        if (!firstProductViewTime) firstProductViewTime = t
      }
      if (e.event === 'add_to_cart') {
        cartAdds++
        if (!firstCartAddTime) firstCartAddTime = t
      }
      if (e.event === 'checkout_start') {
        checkoutStarts++
        if (!firstCheckoutStartTime) firstCheckoutStartTime = t
      }
      if (e.event === 'checkout_complete') checkoutCompletes++
      if (e.event === 'faq_open') faqOpens++
      if (e.event === 'cta_click') {
        ctaClicks++
        if (!firstCtaClickTime) firstCtaClickTime = t
      }
    }
    const engagementScore = Math.min(100, Math.max(0, rawEngagement))

    // Purchase intent score (0–100)
    const purchaseIntentScore = Math.min(100,
      (cartAdds > 0 ? 30 : 0) +
      (checkoutStarts > 0 ? 40 : 0) +
      (ctaClicks * 5) +
      (faqOpens * 3) +
      (maxScrollPct >= 75 ? 10 : maxScrollPct >= 50 ? 5 : 0)
    )

    // Bounce probability: sessions with only 1-2 events
    const bouncedSessions = sessions.filter(s => s.length <= 2).length
    const bounceProbability = sessions.length > 0 ? Math.round((bouncedSessions / sessions.length) * 100) : 0

    // Hesitation score (0–100): how long it took from viewing to acting
    // High hesitation = long gap between product_view → cart add → checkout
    let hesitationScore = 0
    if (firstProductViewTime && firstCartAddTime) {
      const gapMinutes = (firstCartAddTime - firstProductViewTime) / 60000
      // Cap at 60 minutes. 0 min = no hesitation (0 score), 60+ min = max hesitation (100)
      hesitationScore = Math.min(100, Math.round((gapMinutes / 60) * 100))
    } else if (firstProductViewTime && !firstCartAddTime) {
      // Viewed but never added — high hesitation
      hesitationScore = 75
    }

    // Frustration score (0–100): rage clicks + exit pages + bounce sessions
    const frustrationScore = Math.min(100,
      rageClicks * 20 +
      exitPages * 10 +
      (bounceProbability > 60 ? 20 : 0)
    )

    // Attention score (0–100): scroll depth + session duration + returning
    const attentionScore = Math.min(100, Math.round(
      (maxScrollPct * 0.4) +
      (Math.min(totalDuration, 600) / 600 * 40) +
      (sessionCount > 1 ? 20 : 0)
    ))

    // CTA hesitation: time from first product view to first CTA click (seconds)
    const ctaHesitationSec = firstProductViewTime && firstCtaClickTime
      ? Math.round((firstCtaClickTime - firstProductViewTime) / 1000)
      : null

    // First/last device and location
    const firstEvent = events[0]
    const lastEvent = events[events.length - 1]
    const device = firstEvent.device?.type || 'unknown'
    const browser = lastEvent.device?.browser || ''
    const os = lastEvent.device?.os || ''
    const country = lastEvent.geo?.country || firstEvent.geo?.country || ''
    const city = lastEvent.geo?.city || firstEvent.geo?.city || ''
    const region = lastEvent.geo?.region || firstEvent.geo?.region || ''
    const confidence = lastEvent.geo?.confidence || firstEvent.geo?.confidence || 0
    const isp = lastEvent.geo?.isp || firstEvent.geo?.isp || ''
    const asn = lastEvent.geo?.asn || firstEvent.geo?.asn || ''
    // Most recent IP — the one that matches what middleware currently sees for this visitor
    const ip = lastEvent.geo?.ip || firstEvent.geo?.ip || ''
    // All unique IPs this visitor has used — most recent first (events sorted asc, so reverse for last-seen-first)
    const allIps = [...new Set([...events].reverse().map((e: { geo?: { ip?: string } }) => e.geo?.ip).filter(Boolean))] as string[]

    // Is returning (more than 1 session)
    const isReturning = sessionCount > 1

    // UTM source from first session
    const firstWithUtm = events.find(e => e.utm?.source)
    const utmSource = firstWithUtm?.utm?.source || ''
    const utmCampaign = firstWithUtm?.utm?.campaign || ''

    // Session timeline (all sessions with events)
    const sessionTimeline = sessions.map(sess => {
      const sorted = [...sess].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      const dur = sorted.length > 1
        ? Math.round((new Date(sorted[sorted.length - 1].createdAt).getTime() - new Date(sorted[0].createdAt).getTime()) / 1000)
        : 0
      return {
        sessionId: sorted[0].sessionId,
        firstSeen: sorted[0].createdAt,
        lastSeen: sorted[sorted.length - 1].createdAt,
        duration: dur,
        eventCount: sorted.length,
        ip: sorted[0].geo?.ip || '',  // IP for this specific session
        events: sorted.map(e => ({
          event: e.event,
          path: e.path,
          scroll: e.scroll,
          createdAt: e.createdAt,
          meta: e.meta,
        })),
        device: sorted[0].device?.type,
        converted: sorted.some(e => e.event === 'checkout_complete'),
        addedToCart: sorted.some(e => e.event === 'add_to_cart'),
        startedCheckout: sorted.some(e => e.event === 'checkout_start'),
      }
    }).sort((a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime())

    return NextResponse.json({
      visitorId,
      firstSeen,
      lastSeen,
      sessionCount,
      totalDuration: Math.round(totalDuration),
      isReturning,
      engagementScore,
      purchaseIntentScore,
      bounceProbability,
      hesitationScore,
      frustrationScore,
      attentionScore,
      ctaHesitationSec,
      rageClicks,
      maxScrollPct,
      productViews,
      cartAdds,
      checkoutStarts,
      checkoutCompletes,
      faqOpens,
      ctaClicks,
      exitPages,
      device,
      browser,
      os,
      country,
      city,
      region,
      confidence,
      isp,
      asn,
      ip,
      allIps,
      language: firstEvent.language || '',
      timezone: firstEvent.timezone || '',
      utmSource,
      utmCampaign,
      sessionTimeline,
      // Fraud signals
      fraudSignals: {
        rageClicks: rageClicks > 3,
        tooFast: sessions.some(s => {
          const sorted = [...s].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          const dur = sorted.length > 1
            ? (new Date(sorted[sorted.length - 1].createdAt).getTime() - new Date(sorted[0].createdAt).getTime()) / 1000
            : 999
          return dur < 5 && s.some(e => e.event === 'checkout_complete')
        }),
        multipleCheckouts: checkoutCompletes > 2,
      },
    })
  } catch (err) {
    console.error('[visitors/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
