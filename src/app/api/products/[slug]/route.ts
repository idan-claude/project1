import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  await connectDB()
  const product = await Product.findOne({ slug: params.slug, status: 'active' }).populate(
    'category',
    'nameHe slug'
  )
  if (!product) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ product })
}
