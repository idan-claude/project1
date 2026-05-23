import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Category from '@/lib/db/models/Category'

export const PUT = withAdminAuth(async (req, { params }) => {
  await connectDB()
  const body = await req.json()
  const category = await Category.findByIdAndUpdate(params.id, body, { new: true })
  if (!category) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ category })
})

export const DELETE = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  await Category.findByIdAndDelete(params.id)
  return NextResponse.json({ success: true })
})
