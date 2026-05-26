import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import { getClientIP, parseUserAgent } from '@/lib/utils/ipParser'

export const dynamic = 'force-dynamic'

async function geoLookup(ip: string): Promise<{ country: string; city: string; isp: string }> {
  if (!ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: '', city: '', isp: '' }
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 800)
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,isp`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    const data = await res.json()
    if (data.status === 'success') {
      return {
        country: data.country || '',
        city: data.city || '',
        isp: data.isp || '',
      }
    }
  } catch {
    // geo lookup failure is non-fatal
  }
  return { country: '', city: '', isp: '' }
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
