import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const order = await Order.findById(orderId).select('payment.status orderNumber pricing.total')
  if (!order) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  return NextResponse.json({
    status: order.payment.status,
    orderNumber: order.orderNumber,
    total: order.pricing.total,
  })
}
