import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB()
  const source = await Product.findById(params.id).lean() as Record<string, unknown> | null
  if (!source) return NextResponse.json({ error: 'מוצר לא נמצא' }, { status: 404 })

  const { _id, createdAt, updatedAt, __v, ...rest } = source as Record<string, unknown>
  void _id; void createdAt; void updatedAt; void __v

  const copy = await Product.create({
    ...rest,
    nameHe: `${rest.nameHe} (עותק)`,
    slug: `${rest.slug}-copy-${Date.now()}`,
    status: 'draft',
    featured: false,
  })

  return NextResponse.json({ product: copy }, { status: 201 })
})
