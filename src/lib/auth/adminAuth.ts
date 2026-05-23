import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET!

interface AdminPayload {
  email: string
  role: 'admin'
  iat?: number
  exp?: number
}

export function signAdminToken(email: string): string {
  return jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload
  } catch {
    return null
  }
}

export function getAdminTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get('admin_token')?.value ?? null
}

type RouteHandler = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>

export function withAdminAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const token = getAdminTokenFromRequest(req)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyAdminToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return handler(req, ctx)
  }
}
