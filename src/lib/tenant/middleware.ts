/**
 * Store Context Engine — extracts storeId from the request.
 * All admin queries should call getStoreId(req) instead of hardcoding 'default'.
 *
 * Resolution order:
 * 1. Admin JWT (most reliable for admin routes)
 * 2. X-Store-Id header (for internal service calls)
 * 3. Subdomain of host header (for future multi-tenant routing)
 * 4. Falls back to 'default' (single-tenant compat)
 */
import { NextRequest } from 'next/server'
import { getAdminPayload } from '@/lib/auth/adminAuth'

export function getStoreId(req: NextRequest): string {
  // 1. Extract from admin JWT
  const payload = getAdminPayload(req)
  if (payload?.storeId) return payload.storeId

  // 2. Explicit header (internal API calls)
  const header = req.headers.get('x-store-id')
  if (header) return header

  // 3. Subdomain (e.g. store1.platform.com → 'store1')
  const host = req.headers.get('host') ?? ''
  const subdomain = extractSubdomain(host)
  if (subdomain) return subdomain

  return 'default'
}

function extractSubdomain(host: string): string | null {
  // Remove port if present
  const bare = host.split(':')[0]
  const parts = bare.split('.')
  // Only treat as subdomain if there are 3+ parts (sub.domain.tld)
  if (parts.length >= 3) {
    const sub = parts[0]
    // Ignore 'www', 'localhost', 'app', 'admin'
    if (!['www', 'localhost', 'app', 'admin'].includes(sub)) return sub
  }
  return null
}

export function buildStoreFilter(storeId: string): { storeId: string } {
  return { storeId }
}
