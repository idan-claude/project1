import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Category from '@/lib/db/models/Category'
import { slugify } from '@/lib/utils/slugify'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()
  const categories = await Category.find().sort({ sortOrder: 1, nameHe: 1 })
  return NextResponse.json({ categories })
})

export const POST = withAdminAuth(async (req) => {
  await connectDB()
  const body = await req.json()
  const slug = body.slug || slugify(body.nameHe) + '-' + Date.now()
  const category = await Category.create({ ...body, slug })
  return NextResponse.json({ category }, { status: 201 })
})
