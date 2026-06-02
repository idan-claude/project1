import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db/mongoose'
import AdminUser from '@/lib/db/models/AdminUser'
import { getSmtpConfig } from '@/lib/settings/credentials'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'אימייל נדרש' }, { status: 400 })
  }

  await connectDB()

  const user = await AdminUser.findOne({ email: email.toLowerCase(), status: 'active' })

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  user.resetToken = token
  user.resetTokenExpiry = expiry
  await user.save()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
  const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`

  // Try to send email if SMTP is configured
  try {
    const smtp = await getSmtpConfig('default')
    if (smtp?.host && smtp?.user && smtp?.pass) {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: { user: smtp.user, pass: smtp.pass },
      })
      await transporter.sendMail({
        from: `"${smtp.fromName || 'FindCard'}" <${smtp.user}>`,
        to: user.email,
        subject: 'איפוס סיסמה — FindCard',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
            <h2 style="color: #111; margin-bottom: 8px;">איפוס סיסמה</h2>
            <p style="color: #555; margin-bottom: 24px;">קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה להמשך:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">איפוס סיסמה</a>
            <p style="color: #888; font-size: 12px; margin-top: 24px;">הקישור תקף לשעה אחת. אם לא ביקשת לאפס סיסמה, התעלם ממייל זה.</p>
          </div>
        `,
      })
    }
  } catch (err) {
    console.error('[forgot-password] email send failed:', err)
  }

  // Return reset URL in dev mode for testing
  const isDev = process.env.NODE_ENV !== 'production'
  return NextResponse.json({
    success: true,
    ...(isDev ? { resetUrl } : {}),
  })
}
