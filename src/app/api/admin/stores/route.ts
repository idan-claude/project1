import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Store from '@/lib/db/models/Store'
import StoreMember from '@/lib/db/models/StoreMember'

export const dynamic = 'force-dynamic'

// GET /api/admin/stores — list all stores the current admin belongs to
export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  if (!payload || payload.userId === 'legacy') {
    // Legacy admin: return the default store
    const store = await Store.findOne({ storeId: 'default' }).lean()
    return NextResponse.json({ stores: store ? [store] : [] })
  }

  const memberships = await StoreMember.find({
    userId: payload.userId,
    status: 'active',
  }).lean()

  const storeIds = memberships.map(m => m.storeId)
  const stores = await Store.find({ storeId: { $in: storeIds } }).lean()

  return NextResponse.json({
    stores: stores.map(s => ({
      ...s,
      role: memberships.find(m => m.storeId === s.storeId)?.role ?? 'admin',
    })),
  })
})
