import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

// Real conversion intelligence from VisitorEvent aggregations only.
// No mock data, no AI-generated insights — all computed from actual session behavior.
const PAID_FILTER = { 'payment.status': 'paid', testMode: { $ne: true } }

export const GET = withAdminAuth(async () => {
  await connectDB()

  const last30 = new Date(Date.now() - 30 * 86400000)
  const last7  = new Date(Date.now() - 7 * 86400000)

  // Build per-session summary: events, device, utm source, max scroll, converted
  const sessionSummaries = await VisitorEvent.aggregate([
    { $match: { createdAt: { $gte: last30 } } },
    { $sort: { createdAt: 1 } },
    { $group: {
        _id: '$sessionId',
        visitorId:      { $first: '$visitorId' },
        device:         { $first: '$device.type' },
        utmSource:      { $first: '$utm.source' },
        utmMedium:      { $first: '$utm.medium' },
        utmCampaign:    { $first: '$utm.campaign' },
        country:        { $first: '$geo.country' },
        events:         { $push: '$event' },
        maxScroll:      { $max: '$scroll' },
        firstSeen:      { $min: '$createdAt' },
        lastSeen:       { $max: '$createdAt' },
    }},
  ])

  // Derived flags per session
  interface SessionSummary {
    _id: string
    visitorId: string
    device: string
    utmSource: string
    utmMedium: string
    utmCampaign: string
    country: string
    events: string[]
    maxScroll: number
    firstSeen: Date
    lastSeen: Date
  }

  interface EnrichedSession extends SessionSummary {
    converted: boolean
    addedToCart: boolean
    startedCheckout: boolean
    openedFaq: boolean
    viewedGallery: boolean
    durationSeconds: number
  }

  const enriched: EnrichedSession[] = sessionSummaries.map((s: SessionSummary) => ({
    ...s,
    converted:       s.events.includes('checkout_complete'),
    addedToCart:     s.events.includes('add_to_cart'),
    startedCheckout: s.events.includes('checkout_start'),
    openedFaq:       s.events.includes('faq_open'),
    viewedGallery:   s.events.includes('gallery_view'),
    durationSeconds: Math.round((new Date(s.lastSeen).getTime() - new Date(s.firstSeen).getTime()) / 1000),
  }))

  const totalSessions = enriched.length
  if (totalSessions === 0) {
    return NextResponse.json({
      totalSessions: 0,
      overallConversionRate: 0,
      overallAtcRate: 0,
      bySource: [],
      byDevice: [],
      faqImpact: null,
      galleryImpact: null,
      scrollImpact: [],
      topConversionBlockers: [],
      topCampaigns: [],
    })
  }

  // Use actual paid, non-test Order count as authoritative purchase truth
  const paidOrderCount = await Order.countDocuments({ createdAt: { $gte: last30 }, ...PAID_FILTER })

  // When no real paid orders exist, per-session VisitorEvent checkout_complete signals
  // are NOT purchases. Zero out all convRate to prevent false positives.
  const hasRealPurchases = paidOrderCount > 0

  const totalAtc         = enriched.filter(s => s.addedToCart).length
  const overallConvRate  = totalSessions > 0 ? (paidOrderCount / totalSessions) * 100 : 0
  const overallAtcRate   = totalSessions > 0 ? (totalAtc / totalSessions) * 100 : 0

  // Conversion by UTM source
  const sourceMap = new Map<string, { sessions: number; conversions: number; atc: number }>()
  for (const s of enriched) {
    const key = s.utmSource || '(direct)'
    if (!sourceMap.has(key)) sourceMap.set(key, { sessions: 0, conversions: 0, atc: 0 })
    const entry = sourceMap.get(key)!
    entry.sessions++
    if (s.converted) entry.conversions++
    if (s.addedToCart) entry.atc++
  }
  const bySource = Array.from(sourceMap.entries())
    .map(([source, d]) => ({
      source,
      sessions: d.sessions,
      conversions: hasRealPurchases ? d.conversions : 0,
      atc: d.atc,
      convRate: hasRealPurchases && d.sessions > 0 ? +((d.conversions / d.sessions) * 100).toFixed(1) : 0,
      atcRate:  d.sessions > 0 ? +((d.atc / d.sessions) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10)

  // Conversion by device
  const deviceMap = new Map<string, { sessions: number; conversions: number; atc: number }>()
  for (const s of enriched) {
    const key = s.device || 'unknown'
    if (!deviceMap.has(key)) deviceMap.set(key, { sessions: 0, conversions: 0, atc: 0 })
    const entry = deviceMap.get(key)!
    entry.sessions++
    if (s.converted) entry.conversions++
    if (s.addedToCart) entry.atc++
  }
  const byDevice = Array.from(deviceMap.entries())
    .map(([device, d]) => ({
      device,
      sessions: d.sessions,
      conversions: hasRealPurchases ? d.conversions : 0,
      atc: d.atc,
      convRate: hasRealPurchases && d.sessions > 0 ? +((d.conversions / d.sessions) * 100).toFixed(1) : 0,
      atcRate:  d.sessions > 0 ? +((d.atc / d.sessions) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions)

  // FAQ engagement impact on conversion
  const withFaq    = enriched.filter(s => s.openedFaq)
  const withoutFaq = enriched.filter(s => !s.openedFaq)
  const faqImpact = {
    withFaq: {
      sessions:   withFaq.length,
      convRate:   hasRealPurchases && withFaq.length > 0 ? +((withFaq.filter(s => s.converted).length / withFaq.length) * 100).toFixed(1) : 0,
      atcRate:    withFaq.length > 0 ? +((withFaq.filter(s => s.addedToCart).length / withFaq.length) * 100).toFixed(1) : 0,
    },
    withoutFaq: {
      sessions:   withoutFaq.length,
      convRate:   hasRealPurchases && withoutFaq.length > 0 ? +((withoutFaq.filter(s => s.converted).length / withoutFaq.length) * 100).toFixed(1) : 0,
      atcRate:    withoutFaq.length > 0 ? +((withoutFaq.filter(s => s.addedToCart).length / withoutFaq.length) * 100).toFixed(1) : 0,
    },
  }

  // Gallery engagement impact
  const withGallery    = enriched.filter(s => s.viewedGallery)
  const withoutGallery = enriched.filter(s => !s.viewedGallery)
  const galleryImpact = {
    withGallery: {
      sessions: withGallery.length,
      convRate: hasRealPurchases && withGallery.length > 0 ? +((withGallery.filter(s => s.converted).length / withGallery.length) * 100).toFixed(1) : 0,
      atcRate:  withGallery.length > 0 ? +((withGallery.filter(s => s.addedToCart).length / withGallery.length) * 100).toFixed(1) : 0,
    },
    withoutGallery: {
      sessions: withoutGallery.length,
      convRate: hasRealPurchases && withoutGallery.length > 0 ? +((withoutGallery.filter(s => s.converted).length / withoutGallery.length) * 100).toFixed(1) : 0,
      atcRate:  withoutGallery.length > 0 ? +((withoutGallery.filter(s => s.addedToCart).length / withoutGallery.length) * 100).toFixed(1) : 0,
    },
  }

  // Scroll depth bands vs conversion
  const scrollBands = [
    { label: '0–24%',  min: 0,   max: 24  },
    { label: '25–49%', min: 25,  max: 49  },
    { label: '50–74%', min: 50,  max: 74  },
    { label: '75–99%', min: 75,  max: 99  },
    { label: '100%',   min: 100, max: 100 },
  ]
  const scrollImpact = scrollBands.map(band => {
    const group = enriched.filter(s => s.maxScroll >= band.min && s.maxScroll <= band.max)
    return {
      label:    band.label,
      sessions: group.length,
      convRate: hasRealPurchases && group.length > 0 ? +((group.filter(s => s.converted).length / group.length) * 100).toFixed(1) : 0,
      atcRate:  group.length > 0 ? +((group.filter(s => s.addedToCart).length / group.length) * 100).toFixed(1) : 0,
    }
  }).filter(b => b.sessions > 0)

  // Top conversion blockers — derived from real data
  const blockers: { insight: string; severity: 'high' | 'medium' | 'low'; metric: string }[] = []

  // Mobile vs desktop gap
  const mobileData   = byDevice.find(d => d.device === 'mobile')
  const desktopData  = byDevice.find(d => d.device === 'desktop')
  if (mobileData && desktopData && desktopData.convRate > 0) {
    const gap = desktopData.convRate - mobileData.convRate
    if (gap > 1) {
      blockers.push({
        insight: `מובייל מומר ב-${mobileData.convRate}% לעומת דסקטופ ${desktopData.convRate}% — פער של ${gap.toFixed(1)}%`,
        severity: gap > 3 ? 'high' : 'medium',
        metric: `${mobileData.sessions} סשנים מובייל`,
      })
    }
  }

  // FAQ engagement lift
  if (faqImpact.withFaq.sessions >= 5 && faqImpact.withoutFaq.sessions >= 5) {
    const lift = faqImpact.withFaq.atcRate - faqImpact.withoutFaq.atcRate
    if (lift > 3) {
      blockers.push({
        insight: `פתיחת FAQ מגדילה המרת עגלה ב-${lift.toFixed(0)}% — שאלות נפוצות עוזרות`,
        severity: 'medium',
        metric: `${faqImpact.withFaq.sessions} פתחו FAQ`,
      })
    } else if (lift < -3) {
      blockers.push({
        insight: `מבקרים שפותחים FAQ מגיעים עם ספקות — שפר תשובות`,
        severity: 'medium',
        metric: `${faqImpact.withFaq.sessions} פתחו FAQ`,
      })
    }
  }

  // Scroll depth drop-off
  const low = scrollImpact.find(s => s.label === '0–24%')
  if (low && low.sessions > 0 && totalSessions > 0) {
    const lowPct = Math.round((low.sessions / totalSessions) * 100)
    if (lowPct > 40) {
      blockers.push({
        insight: `${lowPct}% מהמבקרים גוללים פחות מ-25% — חלק העליון חייב לשדרג`,
        severity: 'high',
        metric: `${low.sessions} סשנים עם גלילה מינימלית`,
      })
    }
  }

  // High abandonment after cart
  if (totalAtc > 0) {
    const cartToCheckout = enriched.filter(s => s.addedToCart && !s.startedCheckout).length
    const abandonPct = Math.round((cartToCheckout / totalAtc) * 100)
    if (abandonPct > 50) {
      blockers.push({
        insight: `${abandonPct}% מהמוסיפים לעגלה לא מתחילים תשלום — בדוק דף עגלה`,
        severity: 'high',
        metric: `${cartToCheckout} נשרו מהעגלה`,
      })
    }
  }

  // Top converting campaigns (last 7 days)
  const campaignMap = new Map<string, { sessions: number; conversions: number }>()
  for (const s of enriched) {
    if (!s.utmCampaign) continue
    if (!campaignMap.has(s.utmCampaign)) campaignMap.set(s.utmCampaign, { sessions: 0, conversions: 0 })
    const entry = campaignMap.get(s.utmCampaign)!
    entry.sessions++
    if (s.converted) entry.conversions++
  }
  const topCampaigns = Array.from(campaignMap.entries())
    .map(([campaign, d]) => ({
      campaign,
      sessions:    d.sessions,
      conversions: hasRealPurchases ? d.conversions : 0,
      convRate:    hasRealPurchases && d.sessions > 0 ? +((d.conversions / d.sessions) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.convRate - a.convRate)
    .slice(0, 5)

  // Top FAQ questions opened (from meta events)
  const faqOpens = await VisitorEvent.aggregate([
    { $match: { event: 'faq_open', createdAt: { $gte: last7 } } },
    { $group: { _id: '$meta.question', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ])

  return NextResponse.json({
    totalSessions,
    overallConversionRate: +overallConvRate.toFixed(1),
    overallAtcRate:        +overallAtcRate.toFixed(1),
    totalConverted: paidOrderCount,
    totalAtc,
    bySource,
    byDevice,
    faqImpact,
    galleryImpact,
    scrollImpact,
    topConversionBlockers: blockers,
    topCampaigns,
    topFaqOpens: faqOpens.map((f: { _id: string; count: number }) => ({ question: f._id, count: f.count })),
  })
})
