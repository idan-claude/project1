import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import IpBlock from '@/lib/db/models/IpBlock'
import { normalizeIP } from '@/lib/utils/ipParser'

export const dynamic = 'force-dynamic'

// One-time migration: normalize any IP blocks stored with ::ffff: prefix
// Also deduplicates entries where old and new format both exist
export const POST = withAdminAuth(async () => {
  await connectDB()

  const all = await IpBlock.find({ storeId: 'default' }).lean()
  const results: { ip: string; normalizedTo: string; action: string }[] = []

  for (const entry of all) {
    const normalized = normalizeIP(entry.ip)
    if (normalized === entry.ip) continue // already correct, skip

    // Check if a normalized version already exists
    const existing = await IpBlock.findOne({ storeId: 'default', ip: normalized })
    if (existing) {
      // Duplicate — delete the un-normalized entry
      await IpBlock.findByIdAndDelete(entry._id)
      results.push({ ip: entry.ip, normalizedTo: normalized, action: 'deleted_duplicate' })
    } else {
      // Update the entry to use normalized IP
      await IpBlock.findByIdAndUpdate(entry._id, { ip: normalized })
      results.push({ ip: entry.ip, normalizedTo: normalized, action: 'normalized' })
    }
  }

  return NextResponse.json({
    migrated: results.length,
    results,
    message: results.length === 0 ? 'All IPs already normalized' : `Normalized ${results.length} entries`,
  })
})
