import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import { sendOrderWhatsApp } from '@/lib/notifications/whatsapp'
import { sendOrderConfirmationEmail } from '@/lib/notifications/email'
import { triggerAutomation } from '@/lib/automation/trigger'

export const dynamic = 'force-dynamic'

// Cardcom sends POST with form-encoded body
export async function POST(req: NextRequest) {
  await connectDB()

  let body: Record<string, string> = {}
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text()
    body = Object.fromEntries(new URLSearchParams(text))
  } else {
    body = await req.json().catch(() => ({}))
  }

  const {
    ReturnValue: orderId,
    Operation,
    TranzactionId,
    ApprovalNumber,
  } = body

  if (!orderId) return NextResponse.json({ ok: true }) // ignore unknown callbacks

  const order = await Order.findById(orderId)
  if (!order) return NextResponse.json({ ok: true })

  const isSuccess = Operation === '2' || String(Operation) === '2'

  if (isSuccess) {
    order.payment.status = 'paid'
    order.payment.transactionId = TranzactionId || ApprovalNumber || ''
    order.payment.paidAt = new Date()
    order.payment.gatewayResponse = body as Record<string, unknown>
    order.status = 'processing'
    await order.save()

    // Fire notifications (non-blocking)
    sendOrderWhatsApp(order).catch(console.error)
    sendOrderConfirmationEmail(order).catch(console.error)

    // Fire automation triggers
    triggerAutomation('order_confirm', {
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      orderNumber: order.orderNumber,
      orderId: order._id.toString(),
      orderTotal: order.pricing.total,
    }).catch(console.error)
  } else {
    order.payment.status = 'failed'
    order.payment.gatewayResponse = body as Record<string, unknown>
    await order.save()
  }

  return NextResponse.json({ ok: true })
}
