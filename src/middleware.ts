import { NextRequest, NextResponse } from 'next/server'
import { normalizeIP, isPrivateOrInternalIP } from '@/lib/utils/ipParser'

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

// Canonical IP for middleware (Edge Runtime) — same priority order as getClientIP in ipParser.ts
// No x-real-ip-verified here because middleware is what SETS that header.
function getMiddlewareIP(req: NextRequest): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf && !isPrivateOrInternalIP(cf)) return normalizeIP(cf)

  const xReal = req.headers.get('x-real-ip')
  if (xReal && !isPrivateOrInternalIP(xReal)) return normalizeIP(xReal)

  if (req.ip && !isPrivateOrInternalIP(req.ip)) return normalizeIP(req.ip)

  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    for (const seg of fwd.split(',')) {
      const candidate = normalizeIP(seg.trim())
      if (candidate && !isPrivateOrInternalIP(candidate)) return candidate
    }
  }

  const vFwd = req.headers.get('x-vercel-forwarded-for')
  if (vFwd) {
    const candidate = normalizeIP(vFwd.split(',')[0].trim())
    if (candidate && !isPrivateOrInternalIP(candidate)) return candidate
  }

  return '0.0.0.0'
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

  const ip = getMiddlewareIP(req)

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
