import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import { slugify } from '@/lib/utils/slugify'

export const GET = withAdminAuth(async (req) => {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const skip = (page - 1) * limit

  const query: Record<string, unknown> = {}
  if (search) query.$text = { $search: search }
  if (status) query.status = status

  const [products, total] = await Promise.all([
    Product.find(query).populate('category', 'nameHe slug').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(query),
  ])

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) })
})

export const POST = withAdminAuth(async (req) => {
  await connectDB()
  const body = await req.json()

  const slug = body.slug || slugify(body.nameHe) + '-' + Date.now()
  const product = await Product.create({ ...body, slug })

  return NextResponse.json({ product }, { status: 201 })
})
