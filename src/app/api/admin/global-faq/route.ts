import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()
  const settings = await Settings.findOne({ storeId: 'default', key: 'global_faqs' }).lean() as {
    value?: { faqs?: { q: string; a: string }[] }
  } | null
  return NextResponse.json({ faqs: (settings?.value as { faqs?: { q: string; a: string }[] })?.faqs || [] })
})

export const PUT = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const { faqs } = await req.json()
  if (!Array.isArray(faqs)) {
    return NextResponse.json({ error: 'faqs must be array' }, { status: 400 })
  }
  const valid = faqs.filter(f => f && typeof f.q === 'string' && typeof f.a === 'string' && f.q.trim())
  await Settings.findOneAndUpdate(
    { storeId: 'default', key: 'global_faqs' },
    { storeId: 'default', key: 'global_faqs', value: { faqs: valid } },
    { upsert: true, new: true }
  )
  return NextResponse.json({ faqs: valid, ok: true })
})
