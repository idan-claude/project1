import type { Metadata } from 'next'
import './globals.css'
import WhatsAppBubble from '@/components/ui/WhatsAppBubble'
import dynamic from 'next/dynamic'

const MetaPixel = dynamic(() => import('@/components/marketing/MetaPixel'), { ssr: false })

export const metadata: Metadata = {
  title: 'FindCard - כרטיס המעקב החכם',
  description: 'כרטיס מעקב חכם תואם Apple Find My. דק כמו כרטיס אשראי — מצא את הארנק, המפתחות וכל דבר אחר בשניות.',
  keywords: 'FindCard, כרטיס מעקב, Apple Find My, עוקב מיקום, ארנק חכם',
  openGraph: {
    locale: 'he_IL',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
          <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        )}
      </body>
    </html>
  )
}
