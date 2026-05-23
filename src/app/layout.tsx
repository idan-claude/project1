import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrackIt IL - עוקבי מיקום חכמים',
  description: 'עוקבי מיקום חכמים תואמי Apple Find My. לעולם אל תאבד את הדברים שחשובים לך.',
  keywords: 'עוקב מיקום, מעקב חכם, Apple Find My, כרטיס מעקב',
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
      <body>{children}</body>
    </html>
  )
}
