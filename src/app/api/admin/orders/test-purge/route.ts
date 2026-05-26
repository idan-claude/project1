import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

// GET: inspect all paid orders (to identify test/sandbox orders)
export const GET = withAdminAuth(async () => {
  await connectDB()

  const paidOrders = await Order.find({ 'payment.status': 'paid' })
    .select('orderNumber customer.name customer.email pricing.total payment.transactionId payment.paidAt testMode createdAt')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({
    count: paidOrders.length,
    orders: paidOrders.map(o => ({
      id: o._id,
      orderNumber: o.orderNumber,
      name: o.customer.name,
      email: o.customer.email,
      total: o.pricing.total,
      transactionId: o.payment.transactionId,
      paidAt: o.payment.paidAt,
      testMode: o.testMode ?? false,
      createdAt: o.createdAt,
    })),
  })
})

// DELETE: mark specific order(s) as testMode=true OR delete them entirely
// Body: { action: 'mark-test' | 'delete', orderIds?: string[], all?: boolean }
export const DELETE = withAdminAuth(async (req: NextRequest) => {
  await connectDB()

  const body = await req.json().catch(() => ({}))
  const { action, orderIds, all } = body as {
    action?: string
    orderIds?: string[]
    all?: boolean
  }

  if (!action || !['mark-test', 'delete'].includes(action)) {
    return NextResponse.json(
      { error: 'action חייב להיות mark-test או delete' },
      { status: 400 }
    )
  }

  if (!all && (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0)) {
    return NextResponse.json(
      { error: 'נדרש: orderIds (מערך) או all: true' },
      { status: 400 }
    )
  }

  const query = all ? { 'payment.status': 'paid' } : { _id: { $in: orderIds }, 'payment.status': 'paid' }

  if (action === 'mark-test') {
    const result = await Order.updateMany(query, { $set: { testMode: true } })
    return NextResponse.json({
      ok: true,
      action: 'marked-as-test',
      affected: result.modifiedCount,
    })
  }

  if (action === 'delete') {
    const toDelete = await Order.find(query).select('_id orderNumber').lean()
    await Order.deleteMany(query)
    return NextResponse.json({
      ok: true,
      action: 'deleted',
      affected: toDelete.length,
      deletedOrders: toDelete.map(o => ({ id: o._id, orderNumber: o.orderNumber })),
    })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
})
