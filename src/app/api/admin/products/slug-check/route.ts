import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')?.trim()
  const exclude = searchParams.get('exclude')

  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const query = exclude
    ? { slug, _id: { $ne: exclude } }
    : { slug }

  const existing = await Product.findOne(query).select('_id').lean()
  return NextResponse.json({ available: !existing })
})
