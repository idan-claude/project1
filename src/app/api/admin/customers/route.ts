import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    // Aggregate unique customers from orders
    const matchStage = search
      ? {
          $match: {
            $or: [
              { 'customer.name': { $regex: search, $options: 'i' } },
              { 'customer.email': { $regex: search, $options: 'i' } },
              { 'customer.phone': { $regex: search, $options: 'i' } },
            ],
          },
        }
      : { $match: {} }

    const customers = await Order.aggregate([
      matchStage,
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$customer.email',
          name: { $first: '$customer.name' },
          email: { $first: '$customer.email' },
          phone: { $first: '$customer.phone' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          lastOrder: { $first: '$createdAt' },
          firstOrder: { $last: '$createdAt' },
        },
      },
      { $sort: { lastOrder: -1 } },
      { $limit: 100 },
    ])

    return NextResponse.json({ customers, total: customers.length })
  } catch (err) {
    console.error('[GET /api/admin/customers]', err)
    return NextResponse.json({ customers: [], total: 0 }, { status: 500 })
  }
})
