import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const featured = searchParams.get('featured') === 'true'
  const skip = (page - 1) * limit

  const query: Record<string, unknown> = { status: 'active' }
  if (category) query.category = category
  if (search) query.$text = { $search: search }
  if (featured) query.featured = true

  const [products, total] = await Promise.all([
    Product.find(query)
      .select('slug nameHe images pricing featured inventory.quantity')
      .populate('category', 'nameHe slug')
      .skip(skip)
      .limit(limit)
      .sort(featured ? { featured: -1 } : { createdAt: -1 }),
    Product.countDocuments(query),
  ])

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) })
}
