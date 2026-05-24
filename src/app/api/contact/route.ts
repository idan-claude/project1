import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { name, email, phone, subject, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
  }

  try {
    const nodemailer = await import('nodemailer')

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      // SMTP not configured — still return success so UX is not broken
      console.log('[Contact Form]', { name, email, phone, subject, message })
      return NextResponse.json({ ok: true })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    })

    await transporter.sendMail({
      from: `"FindCard Store" <${process.env.SMTP_USER}>`,
      to: 'findcardsupport@gmail.com',
      subject: `פנייה חדשה מהאתר: ${subject || 'ללא נושא'} — ${name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #1e40af;">פנייה חדשה מהאתר FindCard</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">שם:</td><td style="padding: 8px 0;">${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">אימייל:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">טלפון:</td><td style="padding: 8px 0;">${phone || '—'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">נושא:</td><td style="padding: 8px 0;">${subject || '—'}</td></tr>
          </table>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="font-weight: bold; color: #374151; margin: 0 0 8px;">הודעה:</p>
            <p style="margin: 0; white-space: pre-wrap; color: #1f2937;">${message}</p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error('[Contact] Email error:', err)
  }

  return NextResponse.json({ ok: true })
}
