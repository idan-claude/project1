import { NextRequest, NextResponse } from 'next/server'
import { normalizeIP } from '@/lib/utils/ipParser'

// ── Edge cache for API-route blocking (no DB call needed for cached IPs) ─────
const edgeCache = new Map<string, { blocked: boolean; expiry: number }>()
const CACHE_TTL_BLOCKED  = 60_000          // 1 min — blocked stays blocked
const CACHE_TTL_ALLOWED  = 30_000          // 30 sec — so blocks take effect fast

function getCached(ip: string): boolean | null {
  const e = edgeCache.get(ip)
  if (!e) return null
  if (Date.now() > e.expiry) { edgeCache.delete(ip); return null }
  return e.blocked
}

function setCache(ip: string, blocked: boolean) {
  if (edgeCache.size > 1000) {
    let evicted = 0
    edgeCache.forEach((_, k) => { if (evicted < 100) { edgeCache.delete(k); evicted++ } })
  }
  edgeCache.set(ip, { blocked, expiry: Date.now() + (blocked ? CACHE_TTL_BLOCKED : CACHE_TTL_ALLOWED) })
}

const PRIVATE_PREFIXES = ['127.', '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.']

function isPrivate(ip: string): boolean {
  if (ip === '::1' || ip === '0.0.0.0' || !ip) return true
  return PRIVATE_PREFIXES.some(p => ip.startsWith(p))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin auth (cookie presence; full JWT in each API route) ─────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_token')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url))
    // Forward ip + pathname so layout knows to skip admin check
    return forward(req, pathname, true)
  }

  // ── Get authoritative client IP (req.ip set by Vercel Edge directly) ─────
  const rawIp =
    req.ip ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '0.0.0.0'
  const ip = normalizeIP(rawIp)

  // ── Skip routes that must never be IP-blocked ────────────────────────────
  // /blocked itself, internal APIs, admin APIs, and auth APIs
  const NEVER_BLOCK = ['/blocked', '/api/internal/', '/api/admin/', '/api/auth/']
  if (NEVER_BLOCK.some(p => pathname.startsWith(p))) {
    return forward(req, pathname, false, ip)
  }

  // ── IP block check — runs for ALL routes (page + API) ─────────────────────
  // Middleware always executes on every request, bypassing Next.js router cache.
  // Deferring to layout was unreliable: client-side navigation skips server renders.
  if (!isPrivate(ip)) {
    console.log(`[mw] path=${pathname} req.ip=${req.ip} normalized=${ip}`)

    let blocked = getCached(ip)

    if (blocked === null) {
      // Cache miss — query DB via internal endpoint
      try {
        const origin = new URL(req.url).origin
        const res = await fetch(
          `${origin}/api/internal/ip-check?ip=${encodeURIComponent(ip)}`,
          { signal: AbortSignal.timeout(3000) }
        )
        if (res.ok) {
          const data = await res.json() as { blocked: boolean }
          setCache(ip, data.blocked)
          blocked = data.blocked
          console.log(`[mw] ip-check ip=${ip} blocked=${blocked} path=${pathname}`)
        }
      } catch (err) {
        console.log(`[mw] ip-check timeout ip=${ip} — fail open: ${String(err)}`)
        blocked = false
      }
    }

    if (blocked === true) {
      const isApi = pathname.startsWith('/api/')
      console.log(`[mw] BLOCKING ip=${ip} isApi=${isApi} path=${pathname}`)
      if (isApi) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      return NextResponse.redirect(new URL('/blocked', req.url))
    }
  }

  return forward(req, pathname, false, ip)
}

function forward(req: NextRequest, pathname: string, isAdmin: boolean, ip?: string) {
  const headers = new Headers(req.headers)
  headers.set('x-pathname', pathname)
  headers.set('x-is-admin', isAdmin ? '1' : '0')
  if (ip) headers.set('x-real-ip-verified', ip)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
