import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import AuditLog from '@/lib/db/models/AuditLog'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const type = searchParams.get('type') || ''

  const query: Record<string, unknown> = {}
  if (type) query.type = type

  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return NextResponse.json({ logs })
})
