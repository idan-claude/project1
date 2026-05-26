import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import { validateAnalyticsConsistency } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  try {
    await connectDB()
    const report = await validateAnalyticsConsistency()
    return NextResponse.json(report)
  } catch (err) {
    console.error('[analytics/consistency]', err)
    return NextResponse.json({ error: 'Failed to validate consistency', detail: String(err) }, { status: 500 })
  }
})
