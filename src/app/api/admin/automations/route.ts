import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Automation from '@/lib/db/models/Automation'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()
  const automations = await Automation.find().sort({ createdAt: -1 })
  return NextResponse.json({ automations })
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const body = await req.json()
  const automation = await Automation.create(body)
  return NextResponse.json({ automation }, { status: 201 })
})
