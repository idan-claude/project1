import { NextRequest } from 'next/server'

// Strip IPv4-mapped IPv6 so ::ffff:1.2.3.4 matches 1.2.3.4 stored in DB
export function normalizeIP(ip: string): string {
  if (!ip) return ''
  if (ip.startsWith('::ffff:')) return ip.slice(7)
  return ip.trim()
}

// Returns true for any IP that is NOT a real public client IP:
// loopback, private RFC1918, link-local, CGNAT, and IPv6 equivalents.
export function isPrivateOrInternalIP(ip: string): boolean {
  if (!ip || ip === '0.0.0.0') return true
  // IPv6 loopback
  if (ip === '::1') return true
  // IPv6 link-local (fe80::/10) and ULA private (fc00::/7)
  const ipL = ip.toLowerCase()
  if (ipL.startsWith('fe80:') || ipL.startsWith('fc') || ipL.startsWith('fd')) return true
  // Normalize IPv4-mapped IPv6 before IPv4 checks
  const addr = ip.startsWith('::ffff:') ? ip.slice(7) : ip
  const parts = addr.split('.')
  if (parts.length !== 4) return false // real public IPv6 (passed ULA/link-local check above)
  const a = parseInt(parts[0], 10)
  const b = parseInt(parts[1], 10)
  return (
    a === 10 ||                          // 10.0.0.0/8
    a === 127 ||                         // 127.0.0.0/8 loopback
    a === 0 ||                           // 0.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) ||          // 192.168.0.0/16
    (a === 169 && b === 254) ||          // 169.254.0.0/16 link-local
    (a === 100 && b >= 64 && b <= 127)   // 100.64.0.0/10 CGNAT (carrier-grade NAT)
  )
}

// Canonical client IP extraction — used by all API routes (serverless Node.js runtime).
// Priority follows user-specified order; x-real-ip-verified is prepended because
// middleware sets it from its own authoritative Edge-Runtime req.ip before forwarding.
export function getClientIP(req: NextRequest): string {
  // 0. x-real-ip-verified: injected by middleware — same IP the block-check used
  const verified = req.headers.get('x-real-ip-verified')
  if (verified && !isPrivateOrInternalIP(verified)) return normalizeIP(verified)

  // 1. cf-connecting-ip: Cloudflare's real client IP (authoritative when behind CF)
  const cf = req.headers.get('cf-connecting-ip')
  if (cf && !isPrivateOrInternalIP(cf)) return normalizeIP(cf)

  // 2. x-real-ip: Vercel's real client IP
  const xReal = req.headers.get('x-real-ip')
  if (xReal && !isPrivateOrInternalIP(xReal)) return normalizeIP(xReal)

  // 3. First PUBLIC IP in x-forwarded-for chain (client is leftmost; skip private hops)
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    for (const seg of fwd.split(',')) {
      const candidate = normalizeIP(seg.trim())
      if (candidate && !isPrivateOrInternalIP(candidate)) return candidate
    }
  }

  // 4. x-vercel-forwarded-for
  const vFwd = req.headers.get('x-vercel-forwarded-for')
  if (vFwd) {
    const candidate = normalizeIP(vFwd.split(',')[0].trim())
    if (candidate && !isPrivateOrInternalIP(candidate)) return candidate
  }

  // 5. req.ip: authoritative in Vercel Edge Runtime, undefined in Node.js serverless
  if (req.ip && !isPrivateOrInternalIP(req.ip)) return normalizeIP(req.ip)

  return '0.0.0.0'
}

export function parseUserAgent(ua: string): { browser: string; os: string; type: 'mobile' | 'tablet' | 'desktop' | 'unknown' } {
  const str = ua.toLowerCase()
  let browser = 'Unknown'
  let os = 'Unknown'
  let type: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown'

  if (str.includes('firefox')) browser = 'Firefox'
  else if (str.includes('edg/')) browser = 'Edge'
  else if (str.includes('chrome')) browser = 'Chrome'
  else if (str.includes('safari')) browser = 'Safari'
  else if (str.includes('opera') || str.includes('opr/')) browser = 'Opera'

  if (str.includes('windows')) os = 'Windows'
  else if (str.includes('mac os')) os = 'macOS'
  else if (str.includes('iphone') || str.includes('ipad')) os = 'iOS'
  else if (str.includes('android')) os = 'Android'
  else if (str.includes('linux')) os = 'Linux'

  if (str.includes('mobile') || str.includes('iphone')) type = 'mobile'
  else if (str.includes('tablet') || str.includes('ipad')) type = 'tablet'
  else if (str.includes('windows') || str.includes('mac os') || str.includes('linux')) type = 'desktop'

  return { browser, os, type }
}
