import nodemailer from 'nodemailer'
import CommLog from '@/lib/db/models/CommLog'
import { connectDB } from '@/lib/db/mongoose'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (!transporter && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }
  return transporter
}

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return null
  // Lazy-require so the module is optional at build time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio')
  return twilio(sid, token) as {
    messages: {
      create: (opts: { from: string; to: string; body: string }) => Promise<{ sid: string }>
    }
  }
}

function normalisePhone(phone: string): string {
  // Strip whitespace and dashes
  let p = phone.replace(/[\s\-().]/g, '')
  // Convert leading 0 Israeli number to +972
  if (p.startsWith('05') || p.startsWith('07')) {
    p = '+972' + p.slice(1)
  }
  // Ensure + prefix
  if (!p.startsWith('+')) {
    p = '+' + p
  }
  return p
}

// ─── SEND EMAIL ─────────────────────────────────────────────────────────────

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  orderId?: string
  orderNumber?: string
  eventType: string
  scheduledFor?: Date
}): Promise<boolean> {
  await connectDB()

  const t = getTransporter()
  if (!t) {
    // SMTP not configured — log as skipped
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
    await t.sendMail({
      from: `"FindCard" <${process.env.SMTP_USER}>`,
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

// ─── SEND WHATSAPP ──────────────────────────────────────────────────────────

export async function sendWhatsApp(opts: {
  to: string
  message: string
  orderId?: string
  orderNumber?: string
  eventType: string
}): Promise<boolean> {
  await connectDB()

  const client = getTwilioClient()
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!client || !from) {
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

  const toFormatted = `whatsapp:${normalisePhone(opts.to)}`
  const fromFormatted = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`

  try {
    await client.messages.create({
      from: fromFormatted,
      to: toFormatted,
      body: opts.message,
    })

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

// ─── SEND SMS ───────────────────────────────────────────────────────────────

export async function sendSMS(opts: {
  to: string
  message: string
  orderId?: string
  orderNumber?: string
  eventType: string
}): Promise<boolean> {
  await connectDB()

  const client = getTwilioClient()
  const from = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_SMS_FROM

  if (!client || !from) {
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

  const toFormatted = normalisePhone(opts.to)
  // Use raw phone number for SMS (not whatsapp: prefix)
  const fromNumber = from.startsWith('whatsapp:') ? from.replace('whatsapp:', '') : from

  try {
    await client.messages.create({
      from: fromNumber,
      to: toFormatted,
      body: opts.message,
    })

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

// ─── SCHEDULE EMAIL ─────────────────────────────────────────────────────────

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
