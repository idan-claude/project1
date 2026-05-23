import twilio from 'twilio'
import { IOrder } from '@/lib/db/models/Order'
import { formatPrice } from '@/lib/utils/formatPrice'

let client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!client && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }
  return client
}

export async function sendOrderWhatsApp(order: IOrder): Promise<void> {
  const c = getClient()
  if (!c || !process.env.ADMIN_WHATSAPP_NUMBER) return

  const msg = `🛍️ הזמנה חדשה!\nמספר: ${order.orderNumber}\nלקוח: ${order.customer.name}\nטלפון: ${order.customer.phone}\nסכום: ${formatPrice(order.pricing.total)}`

  await c.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: process.env.ADMIN_WHATSAPP_NUMBER,
    body: msg,
  })
}
