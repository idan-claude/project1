import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Review from '@/lib/db/models/Review'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const query = status !== 'all' ? { status } : {}
    const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(100).lean()
    const pending = await Review.countDocuments({ status: 'pending' })
    return NextResponse.json({ reviews, pending })
  } catch (err) {
    console.error('[GET /api/admin/reviews]', err)
    return NextResponse.json({ reviews: [], pending: 0 }, { status: 500 })
  }
})

export const PATCH = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const { id, status } = await req.json()
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'סטטוס לא תקין' }, { status: 400 })
    }
    await Review.findByIdAndUpdate(id, { status })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/admin/reviews]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
})

export const DELETE = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const { id } = await req.json()
    await Review.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/reviews]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
})
