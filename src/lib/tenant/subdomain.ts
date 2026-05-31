/**
 * Subdomain Architecture — foundation for store1.platform.com routing.
 * NOT fully implemented yet. This module provides utilities for future
 * multi-tenant subdomain resolution once DNS is set up.
 *
 * When ready:
 * 1. Add middleware.ts at app root to rewrite subdomain → X-Store-Id header
 * 2. Configure Vercel wildcard domain: *.platform.com
 * 3. Update Store.subdomain to be the routing key
 */

export interface SubdomainConfig {
  storeId: string
  subdomain: string
  customDomain?: string
}

export function buildStoreUrl(subdomain: string, path = ''): string {
  const base = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? 'localhost:3000'
  const protocol = base.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${subdomain}.${base}${path}`
}

export function slugToSubdomain(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63)
}
