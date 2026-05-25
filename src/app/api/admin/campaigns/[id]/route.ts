import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import EmailCampaign from '@/lib/db/models/EmailCampaign'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (_req: NextRequest, { params }) => {
  await connectDB()
  const campaign = await EmailCampaign.findById(params.id)
  if (!campaign) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ campaign })
})

export const PATCH = withAdminAuth(async (req: NextRequest, { params }) => {
  await connectDB()
  const body = await req.json()
  const campaign = await EmailCampaign.findByIdAndUpdate(params.id, body, { new: true })
  if (!campaign) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ campaign })
})

export const DELETE = withAdminAuth(async (_req: NextRequest, { params }) => {
  await connectDB()
  await EmailCampaign.findByIdAndDelete(params.id)
  return NextResponse.json({ ok: true })
})

// POST to /api/admin/campaigns/[id] with action=send triggers the send
export const POST = withAdminAuth(async (req: NextRequest, { params }) => {
  await connectDB()
  const { action } = await req.json()
  if (action !== 'send') return NextResponse.json({ error: 'פעולה לא נתמכת' }, { status: 400 })

  const campaign = await EmailCampaign.findById(params.id)
  if (!campaign) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: 'קמפיין כבר נשלח' }, { status: 400 })

  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASSWORD
  if (!smtpUser || !smtpPass) {
    return NextResponse.json({ error: 'חסרים SMTP_USER ו-SMTP_PASSWORD בסביבת השרת' }, { status: 503 })
  }

  await EmailCampaign.findByIdAndUpdate(params.id, { status: 'sending', 'stats.total': campaign.targetEmails.length })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  })

  let sent = 0
  let bounced = 0
  for (const email of campaign.targetEmails) {
    try {
      await transporter.sendMail({
        from: `FindCard <${smtpUser}>`,
        to: email,
        subject: campaign.subject,
        html: campaign.bodyHtml || campaign.bodyText,
        text: campaign.bodyText,
      })
      sent++
    } catch {
      bounced++
    }
  }

  await EmailCampaign.findByIdAndUpdate(params.id, {
    status: 'sent',
    sentAt: new Date(),
    'stats.sent': sent,
    'stats.bounced': bounced,
  })

  return NextResponse.json({ ok: true, sent, bounced })
})
