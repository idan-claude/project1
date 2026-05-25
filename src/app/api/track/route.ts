import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import { getClientIP, parseUserAgent } from '@/lib/utils/ipParser'

export const dynamic = 'force-dynamic'

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
    } = body

    if (!sessionId || !visitorId) {
      return NextResponse.json({ ok: false, error: 'missing ids' }, { status: 400 })
    }

    const ip = getClientIP(req)
    const ua = req.headers.get('user-agent') || ''
    const { browser, os, type: deviceType } = parseUserAgent(ua)

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
      geo: { ip, country: '', city: '' },
      meta,
      orderId,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/track]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
