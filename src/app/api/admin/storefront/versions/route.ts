import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import StoreTheme from '@/lib/db/models/StoreTheme'
import StoreThemeVersion from '@/lib/db/models/StoreThemeVersion'

export const dynamic = 'force-dynamic'

// GET — list all version snapshots for the store
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

// POST — restore a specific version
export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  const { versionId } = await req.json()
  if (!versionId) return NextResponse.json({ error: 'חסר מזהה גרסה' }, { status: 400 })

  const ver = await StoreThemeVersion.findOne({ _id: versionId, storeId }).lean()
  if (!ver) return NextResponse.json({ error: 'גרסה לא נמצאה' }, { status: 404 })

  const { storeId: _s, version: _v, publishedAt: _pa, publishedBy: _pb, label: _l,
          _id: _id, createdAt: _ca, updatedAt: _ua, ...fields } = ver.snapshot as Record<string, unknown> & typeof ver

  const theme = await StoreTheme.findOneAndUpdate(
    { storeId },
    { $set: { ...fields, status: 'draft', publishedAt: null } },
    { upsert: true, new: true }
  )

  return NextResponse.json({ theme, restored: true })
})
