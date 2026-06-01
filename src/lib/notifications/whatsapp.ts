import { IOrder } from '@/lib/db/models/Order'
import { formatPrice } from '@/lib/utils/formatPrice'
import { getTwilioConfig } from '@/lib/settings/credentials'

export async function sendOrderWhatsApp(order: IOrder, storeId = 'default'): Promise<void> {
  const cfg = await getTwilioConfig(storeId)
  if (!cfg?.accountSid || !cfg?.authToken || !cfg?.fromNumber || !cfg?.adminNumber) return

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio')
  const client = twilio(cfg.accountSid, cfg.authToken)

  const msg = `🛍️ הזמנה חדשה!\nמספר: ${order.orderNumber}\nלקוח: ${order.customer.name}\nטלפון: ${order.customer.phone}\nסכום: ${formatPrice(order.pricing.total)}`

  await client.messages.create({
    from: cfg.fromNumber.startsWith('whatsapp:') ? cfg.fromNumber : `whatsapp:${cfg.fromNumber}`,
    to: cfg.adminNumber.startsWith('whatsapp:') ? cfg.adminNumber : `whatsapp:${cfg.adminNumber}`,
    body: msg,
  })
}
