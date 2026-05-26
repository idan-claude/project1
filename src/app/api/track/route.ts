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

function getVercelGeo(req: NextRequest): { country: string; city: string; region: string; geoTimezone: string; confidence: number } {
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
      confidence: 85,
    }
  }
  return { country: '', city: '', region: '', geoTimezone: '', confidence: 0 }
}

async function geoLookup(ip: string, req: NextRequest): Promise<{ country: string; city: string; region: string; isp: string; geoTimezone: string; asn: string; confidence: number }> {
  const isPrivate = !ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('::1')
  const empty = { country: '', city: '', region: '', isp: '', geoTimezone: '', asn: '', confidence: 0 }

  // Priority 1: ip-api.com — city-level accuracy is better than Vercel's MaxMind for Israeli ISPs
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
        if (data.status === 'success' && data.city) {
          // Translate country name for Israeli origin
          const countryName = COUNTRY_NAMES[data.countryCode] || data.country || ''
          return {
            country: countryName,
            city: data.city || '',
            region: data.regionName || '',
            isp: data.isp || '',
            geoTimezone: data.timezone || '',
            asn: data.as || '',
            confidence: 80,
          }
        }
      }
    } catch {
      // fallthrough to Vercel headers
    }
  }

  // Priority 2: Vercel edge headers — good for country, acceptable for region
  const vercel = getVercelGeo(req)
  if (vercel.country) {
    return { ...vercel, isp: '', asn: '' }
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
