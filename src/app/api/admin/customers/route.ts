import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'

export const GET = withAdminAuth(async (req) => {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const [customers, total] = await Promise.all([
    User.find({}, '-passwordHash').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ])

  return NextResponse.json({ customers, total, page, pages: Math.ceil(total / limit) })
})
