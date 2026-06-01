import { connectDB } from '@/lib/db/mongoose'
import Automation from '@/lib/db/models/Automation'
import { getSmtpConfig, getTwilioConfig } from '@/lib/settings/credentials'

interface TriggerPayload extends Record<string, unknown> {
  customerName: string
  customerEmail: string
  customerPhone?: string
  orderNumber?: string
  orderId?: string
  orderTotal?: number
  productName?: string
  storeId?: string
}

export async function triggerAutomation(
  type: 'order_confirm' | 'abandoned_cart' | 'review_request' | 'shipping_update' | 'winback',
  payload: TriggerPayload
) {
  try {
    await connectDB()
    const automations = await Automation.find({ type, status: 'active' })
    if (automations.length === 0) return

    for (const automation of automations) {
      const delayMs = (automation.triggerConfig.delayMinutes || 0) * 60 * 1000
      if (delayMs === 0) {
        await sendAutomation(automation, payload)
      } else {
        setTimeout(() => sendAutomation(automation, payload).catch(console.error), Math.min(delayMs, 5 * 60 * 1000))
      }
    }
  } catch (err) {
    console.error('[triggerAutomation]', err)
  }
}

async function sendAutomation(
  automation: { _id: unknown; channel: string; emailConfig: { subject: string; body: string }; whatsappConfig: { message: string }; stats: { sent: number } },
  payload: TriggerPayload
) {
  const storeId = payload.storeId ?? 'default'
  const channel = automation.channel

  if (channel === 'email' || channel === 'both') {
    await sendEmailAutomation(automation.emailConfig, payload, storeId)
  }
  if (channel === 'whatsapp' || channel === 'both') {
    await sendWhatsAppAutomation(automation.whatsappConfig, payload, storeId)
  }

  await Automation.findByIdAndUpdate(automation._id, { $inc: { 'stats.sent': 1 } })
}

async function sendEmailAutomation(
  config: { subject: string; body: string },
  payload: TriggerPayload,
  storeId: string
) {
  const cfg = await getSmtpConfig(storeId)
  if (!cfg?.user || !cfg?.pass) return

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: false,
    auth: { user: cfg.user, pass: cfg.pass },
  })

  const subject = interpolate(config.subject, payload)
  const html = interpolate(config.body, payload)

  await transporter.sendMail({
    from: `"${cfg.fromName || 'FindCard'}" <${cfg.user}>`,
    to: payload.customerEmail,
    subject,
    html: html || subject,
  })
}

async function sendWhatsAppAutomation(
  config: { message: string },
  payload: TriggerPayload,
  storeId: string
) {
  if (!payload.customerPhone) return
  const cfg = await getTwilioConfig(storeId)
  if (!cfg?.accountSid || !cfg?.authToken || !cfg?.fromNumber) return

  const twilio = await import('twilio')
  const client = twilio.default(cfg.accountSid, cfg.authToken)
  const body = interpolate(config.message, payload)

  await client.messages.create({
    from: `whatsapp:${cfg.fromNumber}`,
    to: `whatsapp:${payload.customerPhone}`,
    body,
  })
}

function interpolate(template: string, vars: Record<string, unknown>): string {
  return template
    .replace(/\{\{customerName\}\}/g, String(vars.customerName || ''))
    .replace(/\{\{customerEmail\}\}/g, String(vars.customerEmail || ''))
    .replace(/\{\{orderNumber\}\}/g, String(vars.orderNumber || ''))
    .replace(/\{\{orderId\}\}/g, String(vars.orderId || ''))
    .replace(/\{\{orderTotal\}\}/g, vars.orderTotal ? `₪${(Number(vars.orderTotal) / 100).toFixed(0)}` : '')
    .replace(/\{\{productName\}\}/g, String(vars.productName || ''))
}
