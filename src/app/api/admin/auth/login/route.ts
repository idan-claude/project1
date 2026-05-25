import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import AuditLog from '@/lib/db/models/AuditLog'
import { getClientIP, parseUserAgent } from '@/lib/utils/ipParser'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const ip = getClientIP(req)
  const ua = req.headers.get('user-agent') || ''

  const success = email === ADMIN_EMAIL && password === ADMIN_PASSWORD

  // Log to AuditLog (non-blocking)
  connectDB().then(() =>
    AuditLog.create({
      type: success ? 'login_success' : 'login_fail',
      actor: email || 'unknown',
      entity: 'admin',
      entityId: '',
      description: success ? `כניסה מוצלחת — ${email}` : `ניסיון כניסה כושל — ${email}`,
      ip,
      userAgent: ua.slice(0, 512),
    })
  ).catch(console.error)

  if (!success) {
    return NextResponse.json({ error: 'פרטי התחברות שגויים' }, { status: 401 })
  }

  const token = signAdminToken(email)
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
