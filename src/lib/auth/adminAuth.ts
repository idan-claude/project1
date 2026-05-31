import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET!

export interface AdminTokenPayload {
  userId: string
  email: string
  storeId: string
  role: 'owner' | 'admin' | 'manager' | 'support'
  iat?: number
  exp?: number
}

/** Legacy token shape (pre-SaaS). Used for backward compat. */
interface LegacyAdminPayload {
  email: string
  role: 'admin'
  iat?: number
  exp?: number
}

export function signAdminToken(payload: Omit<AdminTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload | LegacyAdminPayload
    // Normalize legacy tokens: no storeId → default store, no userId
    if (!('storeId' in decoded)) {
      const legacy = decoded as LegacyAdminPayload
      return {
        userId: 'legacy',
        email: legacy.email,
        storeId: 'default',
        role: 'owner',
        iat: legacy.iat,
        exp: legacy.exp,
      }
    }
    return decoded as AdminTokenPayload
  } catch {
    return null
  }
}

export function getAdminTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get('admin_token')?.value ?? null
}

export function getAdminPayload(req: NextRequest): AdminTokenPayload | null {
  const token = getAdminTokenFromRequest(req)
  if (!token) return null
  return verifyAdminToken(token)
}

type RouteHandler = (
  req: NextRequest,
  ctx: { params: Record<string, string> }
) => Promise<NextResponse>

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
