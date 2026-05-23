import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderNumber = searchParams.get('orderNumber')?.trim()
  const email = searchParams.get('email')?.trim().toLowerCase()

  if (!orderNumber || !email) {
    return NextResponse.json({ error: 'נדרש מספר הזמנה ואימייל' }, { status: 400 })
  }

  await connectDB()

  const order = await Order.findOne({
    orderNumber,
    'customer.email': email,
  }).select('orderNumber status payment.status createdAt trackingNumber items pricing')

  if (!order) {
    return NextResponse.json({ error: 'לא נמצאה הזמנה' }, { status: 404 })
  }

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment.status,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber,
      items: order.items,
      pricing: order.pricing,
    },
  })
}
