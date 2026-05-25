import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Coupon from '@/lib/db/models/Coupon'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth(async (req, { params }) => {
  try {
    await connectDB()
    const body = await req.json()
    const coupon = await Coupon.findByIdAndUpdate(params.id, body, { new: true })
    if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ coupon })
  } catch (err) {
    console.error('[PATCH /api/admin/coupons/[id]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
})

export const DELETE = withAdminAuth(async (_req, { params }) => {
  try {
    await connectDB()
    await Coupon.findByIdAndDelete(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/coupons/[id]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
})
