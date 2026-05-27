import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import EmailCampaign from '@/lib/db/models/EmailCampaign'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()
  const campaigns = await EmailCampaign.find().sort({ createdAt: -1 }).limit(100)
  return NextResponse.json({ campaigns })
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const body = await req.json()

  // If sending immediately, resolve recipients from segment
  let targetEmails: string[] = body.targetEmails ?? []
  if (body.targetSegment && body.targetSegment !== 'custom') {
    const emails = await resolveSegment(body.targetSegment)
    targetEmails = emails
  }

  const campaign = await EmailCampaign.create({
    name: body.name,
    subject: body.subject,
    bodyHtml: body.bodyHtml ?? '',
    bodyText: body.bodyText ?? '',
    status: body.status ?? 'draft',
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    targetSegment: body.targetSegment ?? 'all',
    targetEmails,
  })

  return NextResponse.json({ campaign }, { status: 201 })
})

async function resolveSegment(segment: string): Promise<string[]> {
  if (segment === 'all' || segment === 'paid') {
    const query = segment === 'paid' ? { 'payment.status': 'paid' } : {}
    const orders = await Order.find(query).select('customer.email').lean()
    const emails = Array.from(new Set(orders.map((o: { customer?: { email?: string } }) => o.customer?.email).filter(Boolean) as string[]))
    return emails
  }
  if (segment === 'unpaid') {
    const orders = await Order.find({ 'payment.status': 'pending' }).select('customer.email').lean()
    return Array.from(new Set(orders.map((o: { customer?: { email?: string } }) => o.customer?.email).filter(Boolean) as string[]))
  }
  return []
}
