import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import IpBlock, { maskIpDisplay } from '@/lib/db/models/IpBlock'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const url  = new URL(req.url)
  const type = url.searchParams.get('type') // 'block' | 'whitelist' | null (all)

  const query: Record<string, unknown> = { storeId: 'default' }
  if (type) query.type = type

  const entries = await IpBlock.find(query).sort({ createdAt: -1 }).limit(100).lean()
  return NextResponse.json({
    entries: entries.map(e => ({
      _id: String(e._id),
      ip: e.ip, // Full IP — admin has full visibility
      ipMasked: e.ipMasked || maskIpDisplay(e.ip), // Legacy field, kept for compatibility
      type: e.type,
      reason: e.reason,
      expiresAt: e.expiresAt,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
    })),
  })
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const { ip, type = 'block', reason = '', expiresAt = null } = await req.json()

  if (!ip || typeof ip !== 'string') {
    return NextResponse.json({ error: 'IP required' }, { status: 400 })
  }

  const entry = await IpBlock.findOneAndUpdate(
    { storeId: 'default', ip: ip.trim() },
    {
      storeId: 'default',
      ip: ip.trim(),
      ipMasked: maskIpDisplay(ip.trim()),
      type,
      reason: reason.slice(0, 200),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: 'admin',
    },
    { upsert: true, new: true }
  )

  return NextResponse.json({
    entry: {
      _id: String(entry._id),
      ipMasked: entry.ipMasked,
      type: entry.type,
      reason: entry.reason,
      createdAt: entry.createdAt,
    },
  })
})

export const DELETE = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await IpBlock.findByIdAndDelete(id)
  return NextResponse.json({ ok: true })
})
