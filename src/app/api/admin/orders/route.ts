import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const GET = withAdminAuth(async (req) => {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status') || ''
  const skip = (page - 1) * limit

  const query: Record<string, unknown> = {}
  if (status) query.status = status

  const [orders, total] = await Promise.all([
    Order.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Order.countDocuments(query),
  ])

  return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) })
})
