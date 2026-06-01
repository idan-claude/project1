import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { getSmtpConfig, getTwilioConfig, getMetaConfig, getTikTokConfig, getCardcomConfig, getCloudinaryConfig } from '@/lib/settings/credentials'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (req: NextRequest, ctx) => {
  const service = ctx.params.service
  const storeId = getAdminPayload(req)?.storeId ?? 'default'

  try {
    switch (service) {
      case 'smtp': {
        const cfg = await getSmtpConfig(storeId)
        if (!cfg?.user || !cfg?.pass) return NextResponse.json({ ok: false, message: 'SMTP לא מוגדר' })
        const t = nodemailer.createTransport({
          host: cfg.host,
          port: cfg.port,
          secure: false,
          auth: { user: cfg.user, pass: cfg.pass },
        })
        await t.verify()
        return NextResponse.json({ ok: true, message: 'החיבור לשרת המייל תקין ✓' })
      }

      case 'twilio': {
        const cfg = await getTwilioConfig(storeId)
        if (!cfg?.accountSid || !cfg?.authToken) return NextResponse.json({ ok: false, message: 'WhatsApp לא מוגדר' })
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.accountSid}.json`, {
          headers: { Authorization: `Basic ${Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64')}` },
        })
        if (!res.ok) return NextResponse.json({ ok: false, message: 'פרטי Twilio שגויים' })
        return NextResponse.json({ ok: true, message: 'חיבור WhatsApp תקין ✓' })
      }

      case 'meta': {
        const cfg = await getMetaConfig(storeId)
        if (!cfg?.pixelId || !cfg?.capiToken) return NextResponse.json({ ok: false, message: 'Meta לא מוגדר' })
        const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.pixelId}?access_token=${cfg.capiToken}`)
        const json = await res.json() as { id?: string; error?: { message: string } }
        if (!res.ok || json.error) return NextResponse.json({ ok: false, message: json.error?.message || 'טוקן לא תקין' })
        return NextResponse.json({ ok: true, message: `Meta Pixel מחובר (${json.id}) ✓` })
      }

      case 'tiktok': {
        const cfg = await getTikTokConfig(storeId)
        if (!cfg?.pixelId || !cfg?.eventsApiToken) return NextResponse.json({ ok: false, message: 'TikTok לא מוגדר' })
        const res = await fetch(`https://business-api.tiktok.com/open_api/v1.3/pixel/list/`, {
          headers: { 'Access-Token': cfg.eventsApiToken },
        })
        if (!res.ok) return NextResponse.json({ ok: false, message: 'טוקן TikTok לא תקין' })
        return NextResponse.json({ ok: true, message: 'TikTok Pixel מחובר ✓' })
      }

      case 'cardcom': {
        const cfg = await getCardcomConfig(storeId)
        if (!cfg?.terminal) return NextResponse.json({ ok: false, message: 'Cardcom לא מוגדר' })
        const t0 = Date.now()
        const res = await fetch('https://secure.cardcom.solutions/api/v11/', { signal: AbortSignal.timeout(5000) })
        const latency = Date.now() - t0
        if (!res.ok && res.status >= 500) return NextResponse.json({ ok: false, message: 'שרת Cardcom לא נגיש' })
        return NextResponse.json({ ok: true, message: `שרת Cardcom נגיש (${latency}ms) ✓` })
      }

      case 'cloudinary': {
        const cfg = await getCloudinaryConfig(storeId)
        if (!cfg?.cloudName || !cfg?.apiKey || !cfg?.apiSecret) return NextResponse.json({ ok: false, message: 'Cloudinary לא מוגדר' })
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/usage`, {
          headers: { Authorization: `Basic ${Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString('base64')}` },
        })
        if (!res.ok) return NextResponse.json({ ok: false, message: 'פרטי Cloudinary שגויים' })
        return NextResponse.json({ ok: true, message: 'אחסון תמונות מחובר ✓' })
      }

      default:
        return NextResponse.json({ ok: false, message: 'שירות לא מוכר' }, { status: 404 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'שגיאת חיבור'
    return NextResponse.json({ ok: false, message: msg })
  }
})
