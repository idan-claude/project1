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

async function geoLookup(ip: string, req: NextRequest): Promise<{ country: string; city: string; region: string; isp: string; geoTimezone: string; confidence: number }> {
  // Priority 1: Vercel edge headers (most accurate, zero latency)
  const vercel = getVercelGeo(req)
  if (vercel.country) {
    return { ...vercel, isp: '' }
  }

  // Priority 2: ip-api.com fallback
  if (!ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: '', city: '', region: '', isp: '', geoTimezone: '', confidence: 0 }
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 800)
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,timezone`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    const data = await res.json()
    if (data.status === 'success') {
      return {
        country: data.country || '',
        city: data.city || '',
        region: data.regionName || '',
        isp: data.isp || '',
        geoTimezone: data.timezone || '',
        confidence: 65,
      }
    }
  } catch {
    // geo lookup failure is non-fatal
  }
  return { country: '', city: '', region: '', isp: '', geoTimezone: '', confidence: 0 }
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
    const geo = await geoLookup(ip)

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
      geo: { ip, ...geo },
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
