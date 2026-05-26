import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import IpBlock from '@/lib/db/models/IpBlock'

// Internal-only endpoint — not protected by admin auth, but:
// 1. Only called from middleware (same deployment)
// 2. Returns minimal data (blocked: true/false)
// 3. No sensitive data exposed
export const dynamic = 'force-dynamic'

// Simple in-process cache to avoid hitting MongoDB on every request
const cache = new Map<string, { blocked: boolean; reason: string; ts: number }>()
const CACHE_TTL_MS = 60_000 // 60 seconds

export async function GET(req: NextRequest) {
  const ip = req.nextUrl.searchParams.get('ip') || ''
  if (!ip) return NextResponse.json({ blocked: false })

  // Check in-process cache first
  const cached = cache.get(ip)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ blocked: cached.blocked, reason: cached.reason })
  }

  try {
    await connectDB()
    const now = new Date()
    const entry = await IpBlock.findOne({
      storeId: 'default',
      ip: ip.trim(),
      type: 'block',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).lean()

    const result = { blocked: !!entry, reason: entry?.reason || '', ts: Date.now() }
    cache.set(ip, result)

    // Evict old cache entries periodically
    if (cache.size > 500) {
      const cutoff = Date.now() - CACHE_TTL_MS * 2
      for (const [key, val] of cache.entries()) {
        if (val.ts < cutoff) cache.delete(key)
      }
    }

    return NextResponse.json({ blocked: result.blocked, reason: result.reason })
  } catch {
    // Fail open — don't block visitors if DB check fails
    return NextResponse.json({ blocked: false })
  }
}
