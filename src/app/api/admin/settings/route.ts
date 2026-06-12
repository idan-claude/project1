import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'
import Store from '@/lib/db/models/Store'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  const storeId = payload?.storeId ?? 'default'
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || 'store'
  const settings = await Settings.findOne({ storeId, key })
  return NextResponse.json({ settings: settings?.value ?? {} })
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  const storeId = payload?.storeId ?? 'default'
  const { key, value } = await req.json()

  const settings = await Settings.findOneAndUpdate(
    { storeId, key },
    { storeId, key, value },
    { upsert: true, new: true }
  )

  // Sync store name to Store model so storefront picks it up
  if (key === 'store' && value?.storeName) {
    await Store.findOneAndUpdate({ storeId }, { name: value.storeName }, { upsert: false })
  }

  return NextResponse.json({ settings: settings.value })
})
