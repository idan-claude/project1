import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req) => {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') || 'store'
  const storeId = searchParams.get('storeId') || 'default'
  const settings = await Settings.findOne({ storeId, key })
  return NextResponse.json({ settings: settings?.value ?? {} })
})

export const POST = withAdminAuth(async (req) => {
  await connectDB()
  const { key, value, storeId = 'default' } = await req.json()
  const settings = await Settings.findOneAndUpdate(
    { storeId, key },
    { storeId, key, value },
    { upsert: true, new: true }
  )
  return NextResponse.json({ settings: settings.value })
})
