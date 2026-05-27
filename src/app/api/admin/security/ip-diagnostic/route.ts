import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import IpBlock from '@/lib/db/models/IpBlock'
import { normalizeIP } from '@/lib/utils/ipParser'

export const dynamic = 'force-dynamic'

// Diagnostic endpoint — helps verify what IP the system sees and whether blocking is wired
export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()

  // Collect every possible IP field
  const reqIp = req.ip ?? null   // set by Vercel/Next.js infrastructure directly
  const xRealIp = req.headers.get('x-real-ip')
  const xForwardedFor = req.headers.get('x-forwarded-for')
  const xVercelForwardedFor = req.headers.get('x-vercel-forwarded-for')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')

  const normalizedReqIp = reqIp ? normalizeIP(reqIp) : null
  const normalizedXReal = xRealIp ? normalizeIP(xRealIp) : null
  const normalizedXFwd = xForwardedFor ? normalizeIP(xForwardedFor.split(',')[0].trim()) : null

  // The IP our code currently uses (first non-null from header chain)
  const effectiveIP = normalizeIP(
    xRealIp ||
    xForwardedFor?.split(',')[0].trim() ||
    cfConnectingIp ||
    '0.0.0.0'
  )

  // Check DB for all candidate IPs
  async function checkDB(ip: string) {
    if (!ip || ip === '0.0.0.0') return null
    return IpBlock.findOne({
      storeId: 'default',
      ip: ip.trim(),
      type: 'block',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).lean()
  }

  const [blockForEffective, blockForReqIp, allBlocks] = await Promise.all([
    checkDB(effectiveIP),
    normalizedReqIp ? checkDB(normalizedReqIp) : null,
    IpBlock.find({ storeId: 'default', type: 'block' }).select('ip expiresAt createdAt').lean(),
  ])

  // Also test a specific IP if provided via query
  const testIp = req.nextUrl.searchParams.get('testIp')
  const blockForTestIp = testIp ? await checkDB(normalizeIP(testIp)) : undefined

  return NextResponse.json({
    // What the system currently picks as the client IP
    effectiveIP,
    effectiveIPIsBlocked: !!blockForEffective,

    // What Vercel sets on req.ip (authoritative)
    reqIp,
    normalizedReqIp,
    reqIpIsBlocked: !!blockForReqIp,

    // Raw headers — helps spot mismatches
    headers: {
      'x-real-ip': xRealIp,
      'x-forwarded-for': xForwardedFor,
      'x-vercel-forwarded-for': xVercelForwardedFor,
      'cf-connecting-ip': cfConnectingIp,
    },

    normalizedValues: {
      fromXRealIp: normalizedXReal,
      fromXForwardedFor: normalizedXFwd,
    },

    // All blocked IPs in DB
    blockedIPsInDB: allBlocks.map(b => ({ ip: b.ip, createdAt: b.createdAt })),

    // Test a specific IP (add ?testIp=1.2.3.4 to URL)
    testIp: testIp ? {
      input: testIp,
      normalized: normalizeIP(testIp),
      isBlocked: !!blockForTestIp,
    } : undefined,

    // Diagnostic notes
    notes: [
      reqIp && reqIp !== effectiveIP
        ? `⚠️ req.ip (${reqIp}) differs from header-derived IP (${effectiveIP}) — middleware may be checking the wrong IP`
        : `✅ req.ip matches header-derived IP`,
      allBlocks.length === 0
        ? `ℹ️ No blocked IPs in DB`
        : `ℹ️ ${allBlocks.length} blocked IP(s) in DB`,
    ],
  })
})
