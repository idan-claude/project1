import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import StoreTheme, { DEFAULT_TOKENS, DEFAULT_SECTIONS } from '@/lib/db/models/StoreTheme'
import StoreThemeVersion from '@/lib/db/models/StoreThemeVersion'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const storeId = getAdminPayload(req)?.storeId ?? 'default'

  let theme = await StoreTheme.findOne({ storeId })
  if (!theme) {
    theme = await StoreTheme.create({
      storeId,
      tokens: DEFAULT_TOKENS,
      sections: DEFAULT_SECTIONS,
      status: 'draft',
    })
  }

  return NextResponse.json({ theme })
})

export const PUT = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  const body = await req.json()

  const theme = await StoreTheme.findOneAndUpdate(
    { storeId },
    { $set: body },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return NextResponse.json({ theme, saved: true })
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  const storeId = payload?.storeId ?? 'default'
  const { action } = await req.json()

  if (action === 'publish') {
    const now = new Date()
    const theme = await StoreTheme.findOneAndUpdate(
      { storeId },
      { $set: { status: 'published', publishedAt: now }, $inc: { version: 1 } },
      { new: true }
    )
    if (theme) {
      const { _id, __v, createdAt, updatedAt, ...snapshot } = theme.toObject()
      await StoreThemeVersion.create({
        storeId,
        version: theme.version,
        publishedAt: now,
        publishedBy: payload?.email || '',
        label: `גרסה ${theme.version}`,
        snapshot,
      })
    }
    return NextResponse.json({ theme, published: true })
  }

  if (action === 'unpublish') {
    const theme = await StoreTheme.findOneAndUpdate(
      { storeId },
      { $set: { status: 'draft', publishedAt: null } },
      { new: true }
    )
    return NextResponse.json({ theme, published: false })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
})
