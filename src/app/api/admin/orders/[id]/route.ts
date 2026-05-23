import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const GET = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  const order = await Order.findById(params.id)
  if (!order) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ order })
})

export const PUT = withAdminAuth(async (req, { params }) => {
  await connectDB()
  const { status, trackingNumber, notes } = await req.json()
  const update: Record<string, unknown> = {}
  if (status) update.status = status
  if (trackingNumber !== undefined) update.trackingNumber = trackingNumber
  if (notes !== undefined) update.notes = notes

  const order = await Order.findByIdAndUpdate(params.id, update, { new: true })
  if (!order) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ order })
})
