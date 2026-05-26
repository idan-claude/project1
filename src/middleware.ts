import { NextRequest, NextResponse } from 'next/server'
import { getClientIP } from '@/lib/utils/ipParser'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin auth check ───────────────────────────────────────────────────────
  // Protect /admin/* (except /admin/login) — cookie presence check only.
  // Full JWT verification happens in each API route via withAdminAuth().
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = req.cookies.get('admin_token')?.value
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    // Admins bypass IP blocking — return early
    return NextResponse.next()
  }

  // ── IP blocklist enforcement for storefront ────────────────────────────────
  // Skip: internal APIs, static assets, blocked page itself
  const skipPaths = ['/api/', '/blocked', '/_next/', '/favicon']
  const shouldCheck = !skipPaths.some(p => pathname.startsWith(p))

  if (shouldCheck) {
    const ip = getClientIP(req)
    if (ip && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.') && ip !== '::1') {
      try {
        // Resolve base URL: prefer VERCEL_URL (always set in Vercel), fall back to localhost
        const base = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')

        const checkUrl = `${base}/api/internal/ip-check?ip=${encodeURIComponent(ip)}`
        const res = await fetch(checkUrl, {
          signal: AbortSignal.timeout(500), // hard 500ms timeout — fail open
        })
        if (res.ok) {
          const { blocked } = await res.json()
          if (blocked) {
            return NextResponse.redirect(new URL('/blocked', req.url))
          }
        }
      } catch {
        // Fail open — DB check failure does NOT block the visitor
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
