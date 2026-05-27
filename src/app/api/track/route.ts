import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import { getClientIP, parseUserAgent } from '@/lib/utils/ipParser'

export const dynamic = 'force-dynamic'

// ISO 3166-1 country code → full name (most relevant)
const COUNTRY_NAMES: Record<string, string> = {
  IL: 'ישראל', US: 'ארצות הברית', GB: 'בריטניה', DE: 'גרמניה', FR: 'צרפת',
  IT: 'איטליה', ES: 'ספרד', NL: 'הולנד', BE: 'בלגיה', SE: 'שוודיה',
  CH: 'שווייץ', AT: 'אוסטריה', PL: 'פולין', CZ: 'צ׳כיה', PT: 'פורטוגל',
  CA: 'קנדה', AU: 'אוסטרליה', JP: 'יפן', CN: 'סין', IN: 'הודו',
  BR: 'ברזיל', MX: 'מקסיקו', RU: 'רוסיה', UA: 'אוקראינה', TR: 'טורקיה',
}

// Israeli ISPs that use CGNAT/centralized routing — city-level data unreliable
const IL_CGNAT_ISPS = ['HOT', 'BEZEQ', 'PARTNER', 'CELLCOM', '012', '013', 'XFONE', 'HOT MOBILE', 'GOLAN', 'RAMI LEVY', 'STING']

// Israeli region mapping: if city confidence is low, map region codes to Hebrew regional labels
const IL_REGION_LABELS: Record<string, string> = {
  'Tel Aviv': 'מרכז הארץ',
  'Central District': 'מרכז הארץ',
  'Jerusalem District': 'ירושלים והסביבה',
  'Haifa District': 'חיפה והצפון',
  'Northern District': 'הצפון',
  'Southern District': 'הדרום',
  'Sharon': 'השרון',
  'Judea and Samaria': 'יהודה ושומרון',
}

function getVercelGeo(req: NextRequest): { country: string; city: string; region: string; geoTimezone: string; confidence: number; geoSource: string } {
  const code = req.headers.get('x-vercel-ip-country') || ''
  const city = decodeURIComponent(req.headers.get('x-vercel-ip-city') || '')
  const region = req.headers.get('x-vercel-ip-region') || ''
  const geoTimezone = req.headers.get('x-vercel-ip-timezone') || ''
  if (code) {
    return {
      country: COUNTRY_NAMES[code] || code,
      city,
      region,
      geoTimezone,
      confidence: 70,
      geoSource: 'vercel-edge',
    }
  }
  return { country: '', city: '', region: '', geoTimezone: '', confidence: 0, geoSource: 'none' }
}

function getIsraeliCityAccuracy(isp: string, city: string, region: string): { confidence: number; cityAccuracy: string; displayCity: string } {
  const ispUpper = (isp || '').toUpperCase()
  const usesCgnat = IL_CGNAT_ISPS.some(name => ispUpper.includes(name))

  if (!usesCgnat) {
    return { confidence: 80, cityAccuracy: 'exact', displayCity: city }
  }

  // CGNAT ISP: city data may be wrong by 20-50km — use regional estimate
  const regionLabel = Object.entries(IL_REGION_LABELS).find(([key]) =>
    region.includes(key) || city.includes(key)
  )?.[1]

  if (regionLabel) {
    return { confidence: 55, cityAccuracy: 'regional', displayCity: regionLabel }
  }

  // Fallback: show city with low confidence marker
  return { confidence: 50, cityAccuracy: 'approximate', displayCity: city }
}

async function geoLookup(ip: string, req: NextRequest): Promise<{
  country: string; city: string; region: string; isp: string
  geoTimezone: string; asn: string; confidence: number; geoSource: string; cityAccuracy: string
}> {
  const isPrivate = !ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('::1')
  const empty = { country: '', city: '', region: '', isp: '', geoTimezone: '', asn: '', confidence: 0, geoSource: 'none', cityAccuracy: '' }

  // Priority 1: ip-api.com — better city-level data than Vercel MaxMind
  if (!isPrivate) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 1200)
      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp,org,timezone,as`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'success') {
          const countryName = COUNTRY_NAMES[data.countryCode] || data.country || ''
          const isIsrael = data.countryCode === 'IL'

          if (isIsrael) {
            const { confidence, cityAccuracy, displayCity } = getIsraeliCityAccuracy(
              data.isp || '', data.city || '', data.regionName || ''
            )
            return {
              country: countryName,
              city: displayCity,
              region: data.regionName || '',
              isp: data.isp || '',
              geoTimezone: data.timezone || '',
              asn: data.as || '',
              confidence,
              geoSource: 'ip-api.com',
              cityAccuracy,
            }
          }

          return {
            country: countryName,
            city: data.city || '',
            region: data.regionName || '',
            isp: data.isp || '',
            geoTimezone: data.timezone || '',
            asn: data.as || '',
            confidence: 80,
            geoSource: 'ip-api.com',
            cityAccuracy: 'exact',
          }
        }
      }
    } catch {
      // fallthrough to Vercel headers
    }
  }

  // Priority 2: Vercel edge headers — reliable for country/region
  const vercel = getVercelGeo(req)
  if (vercel.country) {
    return { ...vercel, isp: '', asn: '', cityAccuracy: 'approximate' }
  }

  return empty
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()
    const {
      sessionId,
      visitorId,
      event = 'pageview',
      path = '',
      referrer = '',
      utm = {},
      meta = {},
      orderId = null,
      language = '',
      timezone = '',
      scroll = 0,
    } = body

    if (!sessionId || !visitorId) {
      return NextResponse.json({ ok: false, error: 'missing ids' }, { status: 400 })
    }

    const ip = getClientIP(req)
    const ua = req.headers.get('user-agent') || ''
    const { browser, os, type: deviceType } = parseUserAgent(ua)
    const geo = await geoLookup(ip, req)

    await VisitorEvent.create({
      sessionId,
      visitorId,
      event,
      path,
      referrer,
      utm: {
        source:   utm.utm_source   || utm.source   || '',
        medium:   utm.utm_medium   || utm.medium   || '',
        campaign: utm.utm_campaign || utm.campaign || '',
        content:  utm.utm_content  || utm.content  || '',
        term:     utm.utm_term     || utm.term     || '',
      },
      device: { type: deviceType, browser, os, userAgent: ua.slice(0, 512) },
      geo: { ip, country: geo.country, city: geo.city, region: geo.region, isp: geo.isp, asn: geo.asn, geoTimezone: geo.geoTimezone, confidence: geo.confidence },
      language: (language || '').slice(0, 20),
      timezone: (timezone || '').slice(0, 60),
      scroll: typeof scroll === 'number' ? scroll : 0,
      meta,
      orderId,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/track]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
