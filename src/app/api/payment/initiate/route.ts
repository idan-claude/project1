import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import { initiateCardcomPayment } from '@/lib/payment/cardcom'

export async function POST(req: NextRequest) {
  await connectDB()
  const { orderId } = await req.json()

  const order = await Order.findById(orderId)
  if (!order) return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 })
  if (order.payment.status === 'paid') {
    return NextResponse.json({ error: 'הזמנה כבר שולמה' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const result = await initiateCardcomPayment({
    orderId: order._id.toString(),
    amount: order.pricing.total,
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    description: `הזמנה ${order.orderNumber}`,
    baseUrl,
  })

  return NextResponse.json({ redirectUrl: result.redirectUrl, lowProfileCode: result.lowProfileCode })
}
