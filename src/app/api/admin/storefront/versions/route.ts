import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import StoreTheme from '@/lib/db/models/StoreTheme'
import StoreThemeVersion from '@/lib/db/models/StoreThemeVersion'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const storeId = getAdminPayload(req)?.storeId ?? 'default'

  const versions = await StoreThemeVersion.find({ storeId })
    .sort({ version: -1 })
    .select('version publishedAt publishedBy label createdAt')
    .limit(50)
    .lean()

  return NextResponse.json({ versions })
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  const { versionId } = await req.json()
  if (!versionId) return NextResponse.json({ error: 'חסר מזהה גרסה' }, { status: 400 })

  const ver = await StoreThemeVersion.findOne({ _id: versionId, storeId }).lean()
  if (!ver) return NextResponse.json({ error: 'גרסה לא נמצאה' }, { status: 404 })

  const snap = ver.snapshot as Record<string, unknown>
  // Restore snapshot fields, but keep it as draft
  const { _id: _a, __v: _b, createdAt: _c, updatedAt: _d, storeId: _e, ...restorableFields } = snap

  const theme = await StoreTheme.findOneAndUpdate(
    { storeId },
    { $set: { ...restorableFields, status: 'draft', publishedAt: null } },
    { upsert: true, new: true }
  )

  return NextResponse.json({ theme, restored: true, restoredVersion: ver.version })
})
