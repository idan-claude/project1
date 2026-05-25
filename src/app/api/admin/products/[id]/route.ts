import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import ProductVersion from '@/lib/db/models/ProductVersion'

export const dynamic = 'force-dynamic'

const MAX_VERSIONS = 20

export const GET = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  const product = await Product.findById(params.id).populate('category', 'nameHe slug')
  if (!product) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ product })
})

export const PUT = withAdminAuth(async (req, { params }) => {
  await connectDB()
  const body = await req.json()

  // Snapshot current state before overwriting
  const before = await Product.findById(params.id).lean()
  if (before) {
    const lastVersion = await ProductVersion.findOne({ productId: params.id }).sort({ version: -1 })
    const nextVersion = (lastVersion?.version ?? 0) + 1
    await ProductVersion.create({
      productId: params.id,
      version: nextVersion,
      snapshot: before,
      savedBy: 'admin',
    })
    // Prune old versions — keep only the last MAX_VERSIONS
    const allVersions = await ProductVersion.find({ productId: params.id }).sort({ version: -1 }).select('_id version')
    if (allVersions.length > MAX_VERSIONS) {
      const toDelete = allVersions.slice(MAX_VERSIONS).map(v => v._id)
      await ProductVersion.deleteMany({ _id: { $in: toDelete } })
    }
  }

  // Handle slug change: validate uniqueness
  if (body.slug && body.slug !== (before as { slug?: string })?.slug) {
    const existing = await Product.findOne({ slug: body.slug, _id: { $ne: params.id } })
    if (existing) return NextResponse.json({ error: 'Slug כבר קיים' }, { status: 409 })
  }

  const product = await Product.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
  if (!product) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ product })
})

export const DELETE = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  await Product.findByIdAndUpdate(params.id, { status: 'archived' })
  return NextResponse.json({ success: true })
})
