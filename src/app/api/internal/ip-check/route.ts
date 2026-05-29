import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import IpBlock from '@/lib/db/models/IpBlock'
import { normalizeIP } from '@/lib/utils/ipParser'

// Internal-only endpoint — not protected by admin auth, but:
// 1. Only called from middleware (same deployment)
// 2. Returns minimal data (blocked: true/false)
// 3. No sensitive data exposed
export const dynamic = 'force-dynamic'

// Pre-warm DB connection at module load so cold-start latency hits the Lambda
// startup, not the first middleware check
connectDB().catch(() => {})

// In-process cache — short TTL for allowed IPs so blocks take effect within seconds
const cache = new Map<string, { blocked: boolean; reason: string; expiry: number }>()
const CACHE_TTL_BLOCKED_MS  = 300_000  // 5 min — blocked stays blocked without hammering DB
const CACHE_TTL_ALLOWED_MS  =   5_000  // 5 sec — so a newly blocked IP is re-checked quickly

export async function GET(req: NextRequest) {
  const ip = normalizeIP(req.nextUrl.searchParams.get('ip') || '')
  if (!ip) return NextResponse.json({ blocked: false })

  // Check in-process cache first
  const cached = cache.get(ip)
  if (cached && Date.now() < cached.expiry) {
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

    const isBlocked = !!entry
    const expiry = Date.now() + (isBlocked ? CACHE_TTL_BLOCKED_MS : CACHE_TTL_ALLOWED_MS)
    cache.set(ip, { blocked: isBlocked, reason: entry?.reason || '', expiry })

    // Evict expired entries periodically
    if (cache.size > 500) {
      const now2 = Date.now()
      cache.forEach((val, key) => { if (now2 > val.expiry) cache.delete(key) })
    }

    return NextResponse.json({ blocked: isBlocked, reason: entry?.reason || '' })
  } catch {
    // Fail open — don't block visitors if DB check fails
    return NextResponse.json({ blocked: false })
  }
}
