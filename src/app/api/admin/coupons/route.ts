import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Coupon from '@/lib/db/models/Coupon'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  try {
    await connectDB()
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    return NextResponse.json({ coupons })
  } catch (err) {
    console.error('[GET /api/admin/coupons]', err)
    return NextResponse.json({ error: 'Server error', coupons: [] }, { status: 500 })
  }
})

export const POST = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const body = await req.json()
    const { code, type, value, maxUses, minOrder, expiresAt } = body
    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type,
      value,
      maxUses: maxUses || null,
      minOrder: minOrder || null,
      expiresAt: expiresAt || null,
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'קוד קופון כבר קיים' }, { status: 409 })
    }
    console.error('[POST /api/admin/coupons]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
})
