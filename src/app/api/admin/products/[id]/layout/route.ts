import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import PageLayout, { DEFAULT_SECTIONS } from '@/lib/db/models/PageLayout'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (_req: NextRequest, { params }) => {
  await connectDB()
  const layout = await PageLayout.findOne({ productId: params.id })
  const sections = layout?.sections?.length ? layout.sections : DEFAULT_SECTIONS
  return NextResponse.json({ sections, hasCustomLayout: !!layout })
})

export const PUT = withAdminAuth(async (req: NextRequest, { params }) => {
  await connectDB()
  const { sections } = await req.json()
  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: 'sections must be array' }, { status: 400 })
  }

  const layout = await PageLayout.findOneAndUpdate(
    { productId: params.id },
    { productId: params.id, storeId: 'default', sections },
    { upsert: true, new: true }
  )
  return NextResponse.json({ sections: layout.sections })
})

export const DELETE = withAdminAuth(async (_req: NextRequest, { params }) => {
  await connectDB()
  await PageLayout.deleteOne({ productId: params.id })
  return NextResponse.json({ sections: DEFAULT_SECTIONS, reset: true })
})
