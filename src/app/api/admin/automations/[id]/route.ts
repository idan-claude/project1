import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Automation from '@/lib/db/models/Automation'

export const dynamic = 'force-dynamic'

export const PATCH = withAdminAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB()
  const body = await req.json()
  const automation = await Automation.findByIdAndUpdate(params.id, { $set: body }, { new: true })
  if (!automation) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  return NextResponse.json({ automation })
})

export const DELETE = withAdminAuth(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await connectDB()
  await Automation.findByIdAndDelete(params.id)
  return NextResponse.json({ ok: true })
})
