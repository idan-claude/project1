import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

export const dynamic = 'force-dynamic'

// Called by Vercel Cron or external scheduler. Protected by CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await connectDB()
  const now = new Date()

  const result = await Product.updateMany(
    { status: 'draft', scheduledAt: { $lte: now, $ne: null } },
    { $set: { status: 'active' }, $unset: { scheduledAt: '' } }
  )

  return NextResponse.json({ published: result.modifiedCount, at: now.toISOString() })
}
