import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'
import { getSmtpConfig } from '@/lib/settings/credentials'

export const dynamic = 'force-dynamic'

// 3 requests per 15 minutes per email
const rateMap = new Map<string, { count: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'אימייל נדרש' }, { status: 400 })

  const key = email.toLowerCase()
  const now = Date.now()
  const window = 15 * 60 * 1000
  const entry = rateMap.get(key)
  if (entry && entry.resetAt > now) {
    if (entry.count >= 3) return NextResponse.json({ error: 'נסה שוב מאוחר יותר' }, { status: 429 })
    entry.count++
  } else {
    rateMap.set(key, { count: 1, resetAt: now + window })
  }

  await connectDB()
  const storeId = process.env.STORE_ID || 'default'
  const user = await User.findOne({ storeId, email: key })

  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true })

  const token = crypto.randomBytes(32).toString('hex')
  user.resetToken = token
  user.resetTokenExpiry = new Date(now + 60 * 60 * 1000) // 1 hour
  await user.save()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const resetUrl = `${baseUrl}/account/reset-password?token=${token}`

  try {
    const smtp = await getSmtpConfig(storeId)
    if (smtp?.host && smtp?.user && smtp?.pass) {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: { user: smtp.user, pass: smtp.pass },
      })
      await transporter.sendMail({
        from: `"${smtp.fromName || 'החנות שלנו'}" <${smtp.user}>`,
        to: user.email,
        subject: 'איפוס סיסמה',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
            <h2 style="color: #111; margin-bottom: 8px;">איפוס סיסמה</h2>
            <p style="color: #555; margin-bottom: 8px;">שלום ${user.name},</p>
            <p style="color: #555; margin-bottom: 24px;">קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה להמשך:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">איפוס סיסמה</a>
            <p style="color: #888; font-size: 12px; margin-top: 24px;">הקישור תקף לשעה אחת. אם לא ביקשת לאפס סיסמה, התעלם ממייל זה.</p>
          </div>
        `,
      })
    }
  } catch (err) {
    console.error('[account/forgot-password] email error:', err)
  }

  const isDev = process.env.NODE_ENV !== 'production'
  return NextResponse.json({ success: true, ...(isDev ? { resetUrl } : {}) })
}
