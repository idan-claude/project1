import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/auth/adminAuth'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'פרטי התחברות שגויים' }, { status: 401 })
  }

  const token = signAdminToken(email)
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
