import nodemailer from 'nodemailer'
import CommLog from '@/lib/db/models/CommLog'
import { connectDB } from '@/lib/db/mongoose'
import { getSmtpConfig, getTwilioConfig } from '@/lib/settings/credentials'

function normalisePhone(phone: string): string {
  let p = phone.replace(/[\s\-().]/g, '')
  if (p.startsWith('05') || p.startsWith('07')) {
    p = '+972' + p.slice(1)
  }
  if (!p.startsWith('+')) {
    p = '+' + p
  }
  return p
}

async function buildTransporter(storeId: string) {
  const cfg = await getSmtpConfig(storeId)
  if (!cfg?.user || !cfg?.pass) return null
  return {
    transporter: nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: false,
      auth: { user: cfg.user, pass: cfg.pass },
    }),
    fromAddress: `"${cfg.fromName || 'FindCard'}" <${cfg.user}>`,
  }
}

// ─── SEND EMAIL ───────────────────────────────────────────────────────────────

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  orderId?: string
  orderNumber?: string
  eventType: string
  scheduledFor?: Date
  storeId?: string
}): Promise<boolean> {
  await connectDB()
  const storeId = opts.storeId ?? 'default'

  const result = await buildTransporter(storeId)
  if (!result) {
    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerEmail: opts.to,
      channel: 'email',
      eventType: opts.eventType,
      subject: opts.subject,
      body: opts.html,
      status: 'skipped',
      error: 'SMTP not configured',
    })
    return false
  }

  try {
    await result.transporter.sendMail({
      from: result.fromAddress,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })

    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerEmail: opts.to,
      channel: 'email',
      eventType: opts.eventType,
      subject: opts.subject,
      body: opts.html,
      status: 'sent',
      sentAt: new Date(),
    })

    return true
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerEmail: opts.to,
      channel: 'email',
      eventType: opts.eventType,
      subject: opts.subject,
      body: opts.html,
      status: 'failed',
      error: errorMsg,
    })
    return false
  }
}

// ─── SEND WHATSAPP ────────────────────────────────────────────────────────────

export async function sendWhatsApp(opts: {
  to: string
  message: string
  orderId?: string
  orderNumber?: string
  eventType: string
  storeId?: string
}): Promise<boolean> {
  await connectDB()
  const storeId = opts.storeId ?? 'default'
  const cfg = await getTwilioConfig(storeId)

  if (!cfg?.accountSid || !cfg?.authToken || !cfg?.fromNumber) {
    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerPhone: opts.to,
      channel: 'whatsapp',
      eventType: opts.eventType,
      body: opts.message,
      status: 'skipped',
      error: 'Twilio WhatsApp not configured',
    })
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio')
  const client = twilio(cfg.accountSid, cfg.authToken)
  const toFormatted = `whatsapp:${normalisePhone(opts.to)}`
  const fromFormatted = cfg.fromNumber.startsWith('whatsapp:') ? cfg.fromNumber : `whatsapp:${cfg.fromNumber}`

  try {
    await client.messages.create({ from: fromFormatted, to: toFormatted, body: opts.message })

    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerPhone: opts.to,
      channel: 'whatsapp',
      eventType: opts.eventType,
      body: opts.message,
      status: 'sent',
      sentAt: new Date(),
    })

    return true
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerPhone: opts.to,
      channel: 'whatsapp',
      eventType: opts.eventType,
      body: opts.message,
      status: 'failed',
      error: errorMsg,
    })
    return false
  }
}

// ─── SEND SMS ─────────────────────────────────────────────────────────────────

export async function sendSMS(opts: {
  to: string
  message: string
  orderId?: string
  orderNumber?: string
  eventType: string
  storeId?: string
}): Promise<boolean> {
  await connectDB()
  const storeId = opts.storeId ?? 'default'
  const cfg = await getTwilioConfig(storeId)

  if (!cfg?.accountSid || !cfg?.authToken || !cfg?.fromNumber) {
    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerPhone: opts.to,
      channel: 'sms',
      eventType: opts.eventType,
      body: opts.message,
      status: 'skipped',
      error: 'Twilio SMS not configured',
    })
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio')
  const client = twilio(cfg.accountSid, cfg.authToken)
  const toFormatted = normalisePhone(opts.to)
  const fromNumber = cfg.fromNumber.startsWith('whatsapp:')
    ? cfg.fromNumber.replace('whatsapp:', '')
    : cfg.fromNumber

  try {
    await client.messages.create({ from: fromNumber, to: toFormatted, body: opts.message })

    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerPhone: opts.to,
      channel: 'sms',
      eventType: opts.eventType,
      body: opts.message,
      status: 'sent',
      sentAt: new Date(),
    })

    return true
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await CommLog.create({
      orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
      orderNumber: opts.orderNumber || '',
      customerPhone: opts.to,
      channel: 'sms',
      eventType: opts.eventType,
      body: opts.message,
      status: 'failed',
      error: errorMsg,
    })
    return false
  }
}

// ─── SCHEDULE EMAIL ───────────────────────────────────────────────────────────

export async function scheduleEmail(opts: {
  to: string
  subject: string
  html: string
  orderId?: string
  orderNumber?: string
  eventType: string
  scheduledFor: Date
}): Promise<void> {
  await connectDB()
  await CommLog.create({
    orderId: opts.orderId || new (require('mongoose').Types.ObjectId)(),
    orderNumber: opts.orderNumber || '',
    customerEmail: opts.to,
    channel: 'email',
    eventType: opts.eventType,
    subject: opts.subject,
    body: opts.html,
    status: 'pending',
    scheduledFor: opts.scheduledFor,
  })
}
