import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload, signAdminToken } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import StoreMember from '@/lib/db/models/StoreMember'

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await req.json()
  if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 })

  const membership = await StoreMember.findOne({
    storeId,
    userId: payload.userId,
    status: 'active',
  })
  if (!membership) {
    return NextResponse.json({ error: 'אין גישה לחנות זו' }, { status: 403 })
  }

  const newToken = signAdminToken({
    userId: payload.userId,
    email: payload.email,
    storeId,
    role: membership.role,
  })

  const res = NextResponse.json({ success: true, storeId })
  res.cookies.set('admin_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
})
