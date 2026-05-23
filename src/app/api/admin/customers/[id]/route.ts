import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'
import Order from '@/lib/db/models/Order'

export const GET = withAdminAuth(async (_req, { params }) => {
  await connectDB()
  const [customer, orders] = await Promise.all([
    User.findById(params.id, '-passwordHash'),
    Order.find({ 'customer.userId': params.id }).sort({ createdAt: -1 }),
  ])
  if (!customer) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ customer, orders })
})
