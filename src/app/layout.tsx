import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import './globals.css'
import WhatsAppBubble from '@/components/ui/WhatsAppBubble'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { connectDB } from '@/lib/db/mongoose'
import IpBlock from '@/lib/db/models/IpBlock'
import { normalizeIP } from '@/lib/utils/ipParser'

const MetaPixel = dynamic(() => import('@/components/marketing/MetaPixel'), { ssr: false })

export const metadata: Metadata = {
  title: 'FindCard - כרטיס המעקב החכם',
  description: 'כרטיס מעקב חכם תואם Apple Find My. דק כמו כרטיס אשראי — מצא את הארנק, המפתחות וכל דבר אחר בשניות.',
  keywords: 'FindCard, כרטיס מעקב, Apple Find My, עוקב מיקום, ארנק חכם',
  openGraph: { locale: 'he_IL', type: 'website' },
}

// Paths where IP blocking must NOT apply
const SKIP_BLOCK = ['/admin', '/blocked', '/api/', '/_next', '/favicon']

async function enforceIPBlock() {
  const hdrs    = await headers()
  const pathname = hdrs.get('x-pathname') || ''
  const isAdmin  = hdrs.get('x-is-admin')  === '1'

  // Skip for admin routes, /blocked itself, API routes, and missing pathname
  if (isAdmin || !pathname || SKIP_BLOCK.some(p => pathname.startsWith(p))) return

  // Use the IP injected by middleware (req.ip — authoritative on Vercel)
  const rawIP = hdrs.get('x-real-ip-verified') || hdrs.get('x-real-ip') || hdrs.get('x-forwarded-for')?.split(',')[0].trim() || ''
  const ip    = normalizeIP(rawIP)

  if (!ip || ip === '0.0.0.0') return

  try {
    await connectDB()
    const block = await IpBlock.findOne({
      storeId: 'default',
      ip,
      type: 'block',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).lean()

    if (block) {
      console.log(`[layout] blocked ip=${ip} path=${pathname}`)
      redirect('/blocked')
    }
  } catch (err) {
    // Fail open — DB error must not block real users
    console.error('[layout] ip-check error:', err)
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await enforceIPBlock()

  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <WhatsAppBubble />
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Suspense>
            <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
          </Suspense>
        )}
      </body>
    </html>
  )
}
