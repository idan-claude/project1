import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import ProductVersion from '@/lib/db/models/ProductVersion'
import Product from '@/lib/db/models/Product'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  const versions = await ProductVersion.find({ productId: params.id })
    .sort({ version: -1 })
    .select('version savedBy note createdAt')
    .limit(20)
  return NextResponse.json({ versions })
})

export const POST = withAdminAuth(async (req, { params }) => {
  await connectDB()
  const { version } = await req.json()
  if (!version) return NextResponse.json({ error: 'version required' }, { status: 400 })

  const v = await ProductVersion.findOne({ productId: params.id, version })
  if (!v) return NextResponse.json({ error: 'גרסה לא נמצאה' }, { status: 404 })

  // Remove internal Mongoose fields from snapshot before restoring
  const { _id, __v, createdAt, updatedAt, ...snapshot } = v.snapshot as Record<string, unknown>
  const product = await Product.findByIdAndUpdate(params.id, snapshot, { new: true })
  if (!product) return NextResponse.json({ error: 'מוצר לא נמצא' }, { status: 404 })

  return NextResponse.json({ product, restored: version })
})
