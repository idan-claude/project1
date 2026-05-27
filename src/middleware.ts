import { NextRequest, NextResponse } from 'next/server'
import { getClientIP } from '@/lib/utils/ipParser'

// Routes exempt from IP block check
const IP_CHECK_SKIP = [
  '/api/internal/ip-check', // would create circular HTTP loop
  '/api/admin/',             // protected by admin JWT, not by IP block
  '/api/auth/',              // NextAuth
  '/blocked',                // the blocked page itself
  '/_next/',
  '/favicon',
]

const PRIVATE_RANGES = ['127.', '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.']

function isPrivateIP(ip: string): boolean {
  if (ip === '::1' || ip === '0.0.0.0') return true
  return PRIVATE_RANGES.some(r => ip.startsWith(r))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin auth (cookie presence — full JWT verified in each API route) ─────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = req.cookies.get('admin_token')?.value
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    return NextResponse.next() // admins bypass IP blocking
  }

  // ── IP blocklist — covers pages AND all storefront API routes ──────────────
  const skipCheck = IP_CHECK_SKIP.some(p => pathname.startsWith(p))
  if (!skipCheck) {
    const ip = getClientIP(req) // already normalized (::ffff: stripped)
    if (ip && !isPrivateIP(ip)) {
      try {
        // Use same origin as current request — always points to correct deployment
        const origin = new URL(req.url).origin
        const checkUrl = `${origin}/api/internal/ip-check?ip=${encodeURIComponent(ip)}`

        const res = await fetch(checkUrl, {
          signal: AbortSignal.timeout(2000), // 2s — survives cold starts
        })
        if (res.ok) {
          const { blocked } = await res.json()
          if (blocked) {
            // Return JSON for API callers; redirect for page visitors
            if (pathname.startsWith('/api/')) {
              return NextResponse.json({ error: 'Access denied' }, { status: 403 })
            }
            return NextResponse.redirect(new URL('/blocked', req.url))
          }
        }
      } catch {
        // Fail open — transient DB/network errors must not block real users
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
