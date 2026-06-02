import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload, signAdminToken } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Store from '@/lib/db/models/Store'
import StoreMember from '@/lib/db/models/StoreMember'

export const dynamic = 'force-dynamic'

function generateStoreId(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20).replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'store'}-${suffix}`
}

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeName } = await req.json()
  if (!storeName?.trim()) return NextResponse.json({ error: 'שם חנות נדרש' }, { status: 400 })

  const storeId = generateStoreId(storeName)

  const store = await Store.create({
    storeId,
    ownerId: payload.userId,
    name: storeName.trim(),
    slug: storeId,
    subdomain: storeId,
    status: 'setup',
    plan: 'free',
  })

  await StoreMember.create({
    storeId,
    userId: payload.userId,
    role: 'owner',
    invitedBy: null,
    status: 'active',
    joinedAt: new Date(),
  })

  const newToken = signAdminToken({
    userId: payload.userId,
    email: payload.email,
    storeId,
    role: 'owner',
  })

  const res = NextResponse.json({ success: true, storeId, storeName: store.name })
  res.cookies.set('admin_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
})
