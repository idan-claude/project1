import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req) => {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || 'store'
  const settings = await Settings.findOne({ key })
  return NextResponse.json({ settings: settings?.value ?? {} })
})

export const POST = withAdminAuth(async (req) => {
  await connectDB()
  const { key, value } = await req.json()
  const settings = await Settings.findOneAndUpdate(
    { key },
    { key, value },
    { upsert: true, new: true }
  )
  return NextResponse.json({ settings: settings.value })
})
