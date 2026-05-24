import { AutomationEvent, TrackingStatus } from '@/lib/tracking/types'
import { sendEmail, sendWhatsApp, scheduleEmail } from '@/lib/email/sender'
import * as Templates from '@/lib/email/templates'
import CommLog from '@/lib/db/models/CommLog'
import { connectDB } from '@/lib/db/mongoose'
import nodemailer from 'nodemailer'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Returns true if we already have a CommLog record with status 'sent' or
 * 'pending' for this orderId + eventType combination.  Used to deduplicate
 * automation triggers so we never send the same notification twice.
 */
async function alreadySent(orderId: string, eventType: string): Promise<boolean> {
  await connectDB()
  const existing = await CommLog.findOne({
    orderId,
    eventType,
    status: { $in: ['sent', 'pending'] },
  }).lean()
  return existing !== null
}

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function buildCtx(event: AutomationEvent): Templates.Ctx {
  return {
    customerName: event.customerName,
    orderNumber: event.orderNumber,
    trackingNumber: event.trackingNumber || undefined,
    latestEvent: event.latestEvent,
    deliveryAddress: event.latestEvent?.location || undefined,
  }
}

// ─── WHATSAPP MESSAGE BUILDERS ───────────────────────────────────────────────

function waMessageForStatus(
  status: TrackingStatus,
  event: AutomationEvent
): string | null {
  const n = event.orderNumber
  const loc = event.latestEvent?.location || ''

  switch (status) {
    case 'arrived_destination':
      return `📦 החבילה שלך #${n} הגיעה לישראל! תצפה למשלוח בקרוב.`
    case 'out_for_delivery':
      return `🚴 השליח בדרך אליך עם הזמנה #${n}! השאר זמין.`
    case 'pickup_available':
      return `📬 ההזמנה #${n} מחכה לאיסוף.${loc ? ` ${loc}` : ''}`
    case 'failed_delivery':
      return `⚠️ לא הצלחנו למסור הזמנה #${n}. נצור קשר.`
    case 'delayed':
      return `⏳ יש עיכוב קל בהזמנה #${n}. נעדכן אותך.`
    case 'delivered':
      return `✅ הזמנה #${n} נמסרה! תהנה 😊`
    default:
      return null
  }
}

// ─── MAIN: PROCESS SHIPMENT EVENT ───────────────────────────────────────────

export async function processShipmentEvent(event: AutomationEvent): Promise<void> {
  await connectDB()

  const { orderId, orderNumber, customerEmail, customerPhone, status } = event
  const ctx = buildCtx(event)

  // Determine which email template to use for this status
  type EmailBuilder = (c: Templates.Ctx) => { subject: string; html: string }
  const emailBuilders: Partial<Record<TrackingStatus, EmailBuilder>> = {
    in_transit: Templates.shippedEmail,
    arrived_destination: Templates.arrivedDestinationEmail,
    customs: Templates.customsEmail,
    pickup_available: Templates.pickupAvailableEmail,
    out_for_delivery: Templates.outForDeliveryEmail,
    delivered: Templates.deliveredEmail,
    delayed: Templates.delayedEmail,
    failed_delivery: Templates.failedDeliveryEmail,
  }

  const builder = emailBuilders[status]

  // Send status email (deduplicated)
  if (builder && customerEmail) {
    const emailEventType = `tracking_${status}`
    const alreadyDone = await alreadySent(orderId, emailEventType)

    if (!alreadyDone) {
      const { subject, html } = builder(ctx)
      await sendEmail({
        to: customerEmail,
        subject,
        html,
        orderId,
        orderNumber,
        eventType: emailEventType,
      })
    }
  }

  // Statuses that also get a customer WhatsApp
  const waCustomerStatuses: TrackingStatus[] = [
    'arrived_destination',
    'out_for_delivery',
    'pickup_available',
    'failed_delivery',
    'delayed',
    'delivered',
  ]

  if (waCustomerStatuses.includes(status) && customerPhone) {
    const waEventType = `wa_customer_${status}`
    const alreadyDone = await alreadySent(orderId, waEventType)

    if (!alreadyDone) {
      const message = waMessageForStatus(status, event)
      if (message) {
        await sendWhatsApp({
          to: customerPhone,
          message,
          orderId,
          orderNumber,
          eventType: waEventType,
        })
      }
    }
  }

  // Admin WhatsApp notifications
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER

  if (adminNumber) {
    if (status === 'failed_delivery') {
      const adminEventType = 'wa_admin_failed_delivery'
      const alreadyDone = await alreadySent(orderId, adminEventType)

      if (!alreadyDone) {
        const adminMsg = `⚠️ כישלון מסירה! הזמנה #${orderNumber} — לקוח: ${event.customerName} (${event.customerPhone || customerEmail})`
        await sendWhatsApp({
          to: adminNumber,
          message: adminMsg,
          orderId,
          orderNumber,
          eventType: adminEventType,
        })
      }
    }

    if (status === 'delivered') {
      const adminEventType = 'wa_admin_delivered'
      const alreadyDone = await alreadySent(orderId, adminEventType)

      if (!alreadyDone) {
        const adminMsg = `✅ נמסר! הזמנה #${orderNumber} — לקוח: ${event.customerName}. 30 יום מהיום לעדכון מלאי.`
        await sendWhatsApp({
          to: adminNumber,
          message: adminMsg,
          orderId,
          orderNumber,
          eventType: adminEventType,
        })
      }
    }
  }

  // Post-delivery scheduled sequence
  if (status === 'delivered' && customerEmail) {
    const sequenceItems: Array<{
      daysDelay: number
      eventType: string
      builder: EmailBuilder
    }> = [
      { daysDelay: 3, eventType: 'scheduled_satisfaction', builder: Templates.satisfactionEmail },
      { daysDelay: 5, eventType: 'scheduled_review_request', builder: Templates.reviewRequestEmail },
      { daysDelay: 14, eventType: 'scheduled_upsell', builder: Templates.upsellEmail },
      { daysDelay: 30, eventType: 'scheduled_repeat_purchase', builder: Templates.repeatPurchaseEmail },
    ]

    for (const item of sequenceItems) {
      const alreadyDone = await alreadySent(orderId, item.eventType)
      if (!alreadyDone) {
        const { subject, html } = item.builder(ctx)
        await scheduleEmail({
          to: customerEmail,
          subject,
          html,
          orderId,
          orderNumber,
          eventType: item.eventType,
          scheduledFor: daysFromNow(item.daysDelay),
        })
      }
    }
  }
}

// ─── PROCESS PENDING SCHEDULED EMAILS ───────────────────────────────────────

/**
 * Picks up CommLog entries with status='pending' and scheduledFor <= now,
 * sends the stored HTML body via nodemailer, and updates the record.
 * Called by a cron job (e.g. every hour).
 *
 * Returns the number of records processed.
 */
export async function processPendingScheduled(): Promise<number> {
  await connectDB()

  const now = new Date()

  const pending = await CommLog.find({
    status: 'pending',
    channel: 'email',
    scheduledFor: { $lte: now },
  }).lean()

  if (!pending.length) return 0

  const smtpUser = process.env.SMTP_USER
  let mailer: nodemailer.Transporter | null = null

  if (smtpUser) {
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: smtpUser,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }

  let processed = 0

  for (const log of pending) {
    if (!mailer || !smtpUser) {
      // Mark skipped — SMTP not available
      await CommLog.updateOne(
        { _id: log._id },
        { $set: { status: 'skipped', error: 'SMTP not configured', sentAt: now } }
      )
      processed++
      continue
    }

    try {
      await mailer.sendMail({
        from: `"FindCard" <${smtpUser}>`,
        to: log.customerEmail,
        subject: log.subject,
        html: log.body,
      })

      await CommLog.updateOne(
        { _id: log._id },
        { $set: { status: 'sent', sentAt: new Date() } }
      )
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      await CommLog.updateOne(
        { _id: log._id },
        { $set: { status: 'failed', error: errorMsg } }
      )
    }

    processed++
  }

  return processed
}
