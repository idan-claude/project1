import { NextRequest, NextResponse } from 'next/server'
import { getClientIP } from '@/lib/utils/ipParser'

// ── Edge-side cache (persists within a V8 isolate / edge node) ───────────────
// Avoids HTTP round-trip to serverless for already-seen IPs.
// Entries expire independently so new blocks take effect quickly.
const edgeCache = new Map<string, { blocked: boolean; expiry: number }>()
const CACHE_TTL_ALLOWED  = 5 * 60 * 1000   // 5 min for non-blocked IPs
const CACHE_TTL_BLOCKED  = 60 * 1000        // 1 min for blocked (allow quick unblocking)
const CACHE_MAX_SIZE     = 2000

function getCached(ip: string): boolean | null {
  const entry = edgeCache.get(ip)
  if (!entry) return null
  if (Date.now() > entry.expiry) { edgeCache.delete(ip); return null }
  return entry.blocked
}

function setCache(ip: string, blocked: boolean) {
  if (edgeCache.size >= CACHE_MAX_SIZE) {
    // Evict oldest 200 entries
    const keys = [...edgeCache.keys()].slice(0, 200)
    keys.forEach(k => edgeCache.delete(k))
  }
  edgeCache.set(ip, {
    blocked,
    expiry: Date.now() + (blocked ? CACHE_TTL_BLOCKED : CACHE_TTL_ALLOWED),
  })
}

// ── Route skip list ───────────────────────────────────────────────────────────
const IP_CHECK_SKIP = [
  '/api/internal/ip-check',   // would cause circular HTTP loop
  '/api/admin/',               // protected by admin JWT
  '/api/auth/',                // NextAuth
  '/blocked',
  '/_next/',
  '/favicon',
]

const PRIVATE_PREFIXES = [
  '127.', '10.', '192.168.',
  '172.16.', '172.17.', '172.18.', '172.19.', '172.20.',
  '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
  '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
]

function isPrivate(ip: string): boolean {
  if (ip === '::1' || ip === '0.0.0.0') return true
  return PRIVATE_PREFIXES.some(p => ip.startsWith(p))
}

// ── Main middleware ───────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Admin: cookie check only (full JWT in each API route via withAdminAuth)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_token')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url))
    return NextResponse.next()
  }

  // IP block check
  if (!IP_CHECK_SKIP.some(p => pathname.startsWith(p))) {
    const ip = getClientIP(req)   // uses req.ip first (authoritative on Vercel)

    if (ip && !isPrivate(ip)) {
      // 1. Check edge cache (zero latency)
      const cached = getCached(ip)
      if (cached === true) {
        console.log(`[middleware] BLOCKED (cache) ip=${ip} path=${pathname}`)
        return pathname.startsWith('/api/')
          ? NextResponse.json({ error: 'Access denied' }, { status: 403 })
          : NextResponse.redirect(new URL('/blocked', req.url))
      }
      if (cached === false) {
        // Confirmed non-blocked recently — pass through without DB call
        return NextResponse.next()
      }

      // 2. Cache miss — call ip-check serverless
      try {
        const origin = new URL(req.url).origin
        const res = await fetch(
          `${origin}/api/internal/ip-check?ip=${encodeURIComponent(ip)}`,
          { signal: AbortSignal.timeout(3000) }
        )

        if (res.ok) {
          const data = await res.json() as { blocked: boolean }
          setCache(ip, data.blocked)
          console.log(`[middleware] ip-check ip=${ip} blocked=${data.blocked} path=${pathname}`)

          if (data.blocked) {
            return pathname.startsWith('/api/')
              ? NextResponse.json({ error: 'Access denied' }, { status: 403 })
              : NextResponse.redirect(new URL('/blocked', req.url))
          }
        } else {
          console.log(`[middleware] ip-check HTTP ${res.status} for ip=${ip} — fail open`)
        }
      } catch (err) {
        console.log(`[middleware] ip-check timeout/error for ip=${ip} — fail open: ${String(err)}`)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
