import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

export const GET = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  const product = await Product.findById(params.id).populate('category', 'nameHe slug')
  if (!product) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ product })
})

export const PUT = withAdminAuth(async (req, { params }) => {
  await connectDB()
  const body = await req.json()
  const product = await Product.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
  if (!product) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ product })
})

export const DELETE = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  await Product.findByIdAndUpdate(params.id, { status: 'archived' })
  return NextResponse.json({ success: true })
})
