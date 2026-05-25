import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const query: Record<string, unknown> = {}
    if (status && status !== 'all') query['payment.status'] = status
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100).lean()
    const payments = orders.map((o: any) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customer: o.customer?.name || '—',
      amount: o.pricing?.total || 0,
      method: o.payment?.method || 'cardcom',
      status: o.payment?.status || 'pending',
      paidAt: o.payment?.paidAt || o.createdAt,
      createdAt: o.createdAt,
    }))
    const totalSuccess = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
    return NextResponse.json({ payments, totalSuccess })
  } catch (err) {
    console.error('[GET /api/admin/payments]', err)
    return NextResponse.json({ error: 'Server error', payments: [], totalSuccess: 0 }, { status: 500 })
  }
})
