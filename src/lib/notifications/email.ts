import nodemailer from 'nodemailer'
import { IOrder } from '@/lib/db/models/Order'
import { formatPrice } from '@/lib/utils/formatPrice'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function sendOrderConfirmationEmail(order: IOrder): Promise<void> {
  if (!process.env.SMTP_USER) return

  const transporter = getTransporter()
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.nameHe}${i.variantLabel ? ` (${i.variantLabel})` : ''}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:left">${formatPrice(i.totalPrice)}</td></tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;direction:rtl;}</style></head>
    <body style="background:#f4f4f4;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
        <h1 style="color:#2563eb;margin-top:0">אישור הזמנה</h1>
        <p>שלום ${order.customer.name},</p>
        <p>תודה על הזמנתך! קיבלנו את הזמנה מספר <strong>${order.orderNumber}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <thead><tr style="background:#f8f9fa"><th style="padding:8px;text-align:right">מוצר</th><th style="padding:8px">כמות</th><th style="padding:8px;text-align:left">מחיר</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="font-size:18px;font-weight:bold">סה"כ לתשלום: ${formatPrice(order.pricing.total)}</p>
        <p style="color:#666;font-size:14px">ניצור איתך קשר בקרוב לגבי המשלוח.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:12px">TrackIt IL — עוקבי מיקום חכמים</p>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"TrackIt IL" <${process.env.SMTP_USER}>`,
    to: order.customer.email,
    subject: `אישור הזמנה ${order.orderNumber} | TrackIt IL`,
    html,
  })

  // Admin notification
  if (process.env.ADMIN_EMAIL_TO) {
    await transporter.sendMail({
      from: `"TrackIt IL" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL_TO,
      subject: `הזמנה חדשה ${order.orderNumber} - ${formatPrice(order.pricing.total)}`,
      text: `הזמנה חדשה מ-${order.customer.name} (${order.customer.email})\nמספר: ${order.orderNumber}\nסכום: ${formatPrice(order.pricing.total)}`,
    })
  }
}
