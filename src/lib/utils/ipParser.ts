import { NextRequest } from 'next/server'

// Strip IPv6-mapped IPv4 so ::ffff:1.2.3.4 matches 1.2.3.4 stored in DB
export function normalizeIP(ip: string): string {
  if (ip.startsWith('::ffff:')) return ip.slice(7)
  return ip
}

export function getClientIP(req: NextRequest): string {
  // x-real-ip-verified is set by middleware from req.ip (Edge authoritative) — same IP that middleware checks for blocking
  const raw =
    req.headers.get('x-real-ip-verified') ||
    req.ip ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    '0.0.0.0'
  return normalizeIP(raw)
}

export function parseUserAgent(ua: string): { browser: string; os: string; type: 'mobile' | 'tablet' | 'desktop' | 'unknown' } {
  const str = ua.toLowerCase()
  let browser = 'Unknown'
  let os = 'Unknown'
  let type: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown'

  // Browser
  if (str.includes('firefox')) browser = 'Firefox'
  else if (str.includes('edg/')) browser = 'Edge'
  else if (str.includes('chrome')) browser = 'Chrome'
  else if (str.includes('safari')) browser = 'Safari'
  else if (str.includes('opera') || str.includes('opr/')) browser = 'Opera'

  // OS
  if (str.includes('windows')) os = 'Windows'
  else if (str.includes('mac os')) os = 'macOS'
  else if (str.includes('iphone') || str.includes('ipad')) os = 'iOS'
  else if (str.includes('android')) os = 'Android'
  else if (str.includes('linux')) os = 'Linux'

  // Device type
  if (str.includes('mobile') || str.includes('iphone')) type = 'mobile'
  else if (str.includes('tablet') || str.includes('ipad')) type = 'tablet'
  else if (str.includes('windows') || str.includes('mac os') || str.includes('linux')) type = 'desktop'

  return { browser, os, type }
}
