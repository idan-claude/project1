import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyAdminToken } from '@/lib/auth/adminAuth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect /account/* — requires NextAuth session
  if (pathname.startsWith('/account')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + pathname, req.url))
    }
  }

  // Protect /admin/* (except /admin/login) — requires admin JWT cookie
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminToken = req.cookies.get('admin_token')?.value
    if (!adminToken || !verifyAdminToken(adminToken)) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
}
