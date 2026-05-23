import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, getAdminTokenFromRequest } from '@/lib/auth/adminAuth'

export async function GET(req: NextRequest) {
  const token = getAdminTokenFromRequest(req)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyAdminToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  return NextResponse.json({ email: payload.email, role: payload.role })
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_token')
  return res
}
