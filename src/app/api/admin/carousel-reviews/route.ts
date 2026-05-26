import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()
  const settings = await Settings.findOne({ storeId: 'default', key: 'carousel_reviews' }).lean() as {
    value?: { reviews?: { name: string; photo?: string; rating: number; text: string; location?: string; detail?: string }[] }
  } | null
  return NextResponse.json({ reviews: settings?.value?.reviews || [] })
})

export const PUT = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const { reviews } = await req.json()
  if (!Array.isArray(reviews)) {
    return NextResponse.json({ error: 'reviews must be array' }, { status: 400 })
  }
  const valid = reviews.filter(r => r && typeof r.name === 'string' && typeof r.text === 'string' && r.name.trim() && r.text.trim())
  await Settings.findOneAndUpdate(
    { storeId: 'default', key: 'carousel_reviews' },
    { storeId: 'default', key: 'carousel_reviews', value: { reviews: valid } },
    { upsert: true, new: true }
  )
  return NextResponse.json({ reviews: valid, ok: true })
})
