import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const query: Record<string, unknown> = {}
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ]
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100).lean()
    const invoices = orders.map((o: any) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      customer: o.customer?.name || '—',
      email: o.customer?.email || '—',
      total: o.pricing?.total || 0,
      date: o.createdAt,
      status: o.payment?.status || 'pending',
      shippingAddress: o.shippingAddress,
      items: o.items,
    }))
    return NextResponse.json({ invoices })
  } catch (err) {
    console.error('[GET /api/admin/invoices]', err)
    return NextResponse.json({ error: 'Server error', invoices: [] }, { status: 500 })
  }
})
