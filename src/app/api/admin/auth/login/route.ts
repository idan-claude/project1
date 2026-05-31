import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signAdminToken } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import AuditLog from '@/lib/db/models/AuditLog'
import AdminUser from '@/lib/db/models/AdminUser'
import StoreMember from '@/lib/db/models/StoreMember'
import { getClientIP, parseUserAgent } from '@/lib/utils/ipParser'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const ip = getClientIP(req)
  const ua = req.headers.get('user-agent') || ''

  await connectDB()

  let userId = 'legacy'
  let storeId = 'default'
  let role: 'owner' | 'admin' | 'manager' | 'support' = 'owner'
  let success = false

  // Try DB-backed authentication first
  const adminUser = await AdminUser.findOne({ email: email?.toLowerCase(), status: 'active' })
  if (adminUser) {
    const valid = await bcrypt.compare(password, adminUser.passwordHash)
    if (valid) {
      success = true
      userId = adminUser._id.toString()
      // Find the first active store membership for this user
      const membership = await StoreMember.findOne({ userId: adminUser._id, status: 'active' })
        .sort({ joinedAt: 1 })
      if (membership) {
        storeId = membership.storeId
        role = membership.role
      }
    }
  }

  // Fallback: ENV-based auth (for initial setup, backward compat)
  if (!success && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      success = true
      // Legacy session: storeId defaults to 'default', userId stays 'legacy'
    }
  }

  AuditLog.create({
    type: success ? 'login_success' : 'login_fail',
    actor: email || 'unknown',
    entity: 'admin',
    entityId: '',
    description: success ? `כניסה מוצלחת — ${email}` : `ניסיון כניסה כושל — ${email}`,
    ip,
    userAgent: ua.slice(0, 512),
  }).catch(console.error)

  if (!success) {
    return NextResponse.json({ error: 'פרטי התחברות שגויים' }, { status: 401 })
  }

  const token = signAdminToken({ userId, email, storeId, role })
  const res = NextResponse.json({ success: true, storeId })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
