import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import { PAID_FILTER } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async () => {
  await connectDB()

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [paidOrders7d, metaFired7d, tiktokFired7d] = await Promise.all([
    Order.countDocuments({ ...PAID_FILTER, 'payment.paidAt': { $gte: since7d } }),
    Order.countDocuments({ ...PAID_FILTER, 'payment.paidAt': { $gte: since7d }, 'tracking.metaCapiFired': true }),
    Order.countDocuments({ ...PAID_FILTER, 'payment.paidAt': { $gte: since7d }, 'tracking.tiktokCapiFired': true }),
  ])

  const metaPixelId   = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
  const metaCapiToken = process.env.META_CAPI_TOKEN || ''
  const tiktokPixelId = process.env.TIKTOK_PIXEL_ID || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || ''
  const tiktokToken   = process.env.TIKTOK_EVENTS_API_TOKEN || ''
  const ga4Id         = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''
  const gtmId         = process.env.NEXT_PUBLIC_GTM_ID || ''
  const gadsId        = process.env.NEXT_PUBLIC_GADS_ID || ''

  return NextResponse.json({
    paidOrders7d,
    integrations: [
      {
        id: 'meta',
        name: 'Meta (Facebook)',
        description: 'פרסום ממוקד בפייסבוק ואינסטגרם',
        logoEmoji: '📘',
        pixelConfigured: !!metaPixelId,
        pixelId: metaPixelId,
        serverSideConfigured: !!metaCapiToken,
        fired7d: metaFired7d,
        deliveryRate: paidOrders7d > 0 ? Math.round((metaFired7d / paidOrders7d) * 100) : null,
        detailUrl: '/admin/marketing/meta',
        envVars: [
          { key: 'NEXT_PUBLIC_META_PIXEL_ID', description: 'מזהה הפיקסל (גלוי בדפדפן)', required: true },
          { key: 'META_PIXEL_ID',             description: 'מזהה הפיקסל (שרת)',           required: true },
          { key: 'META_CAPI_TOKEN',           description: 'System User Token מ-Events Manager', required: true },
          { key: 'META_CAPI_TEST_CODE',       description: 'קוד בדיקה (אופציונלי — לסביבת פיתוח)', required: false },
        ],
        setupSteps: [
          'היכנס ל-Facebook Business Manager שלך',
          'לך ל-Events Manager → Data Sources → Pixels',
          'צור פיקסל חדש או בחר קיים — העתק את ה-Pixel ID',
          'לך ל-Settings → Conversions API → Generate Access Token',
          'הוסף את שני הערכים ל-Vercel Environment Variables',
          'פרס מחדש ואמת שהסטטוס הפך לירוק',
        ],
      },
      {
        id: 'tiktok',
        name: 'TikTok',
        description: 'פרסום ממוקד ב-TikTok',
        logoEmoji: '🎵',
        pixelConfigured: !!tiktokPixelId,
        pixelId: tiktokPixelId,
        serverSideConfigured: !!tiktokToken,
        fired7d: tiktokFired7d,
        deliveryRate: paidOrders7d > 0 ? Math.round((tiktokFired7d / paidOrders7d) * 100) : null,
        detailUrl: '/admin/marketing/tiktok',
        envVars: [
          { key: 'NEXT_PUBLIC_TIKTOK_PIXEL_ID', description: 'מזהה הפיקסל מ-TikTok Ads Manager', required: true },
          { key: 'TIKTOK_PIXEL_ID',             description: 'מזהה הפיקסל (שרת)',                  required: true },
          { key: 'TIKTOK_EVENTS_API_TOKEN',     description: 'Access Token מ-TikTok for Business', required: true },
        ],
        setupSteps: [
          'היכנס ל-TikTok Ads Manager שלך',
          'לך ל-Assets → Events → Web Events → Manage',
          'צור פיקסל חדש → בחר "Events API" → העתק את ה-Pixel ID',
          'לך ל-Settings → Generate Access Token',
          'הוסף את הערכים ל-Vercel Environment Variables',
          'פרס מחדש ובדוק שהמשלוחים מגיעים',
        ],
      },
      {
        id: 'ga4',
        name: 'Google Analytics 4',
        description: 'מדידת ביקורים, המרות ומשפכי מכירה',
        logoEmoji: '📊',
        pixelConfigured: !!ga4Id,
        pixelId: ga4Id,
        serverSideConfigured: false,
        fired7d: null,
        deliveryRate: null,
        detailUrl: null,
        envVars: [
          { key: 'NEXT_PUBLIC_GA4_MEASUREMENT_ID', description: 'Measurement ID מ-Google Analytics (G-XXXXXXXX)', required: true },
        ],
        setupSteps: [
          'היכנס ל-Google Analytics → Admin → Data Streams',
          'בחר או צור Web Stream עבור האתר שלך',
          'העתק את ה-Measurement ID (מתחיל ב-G-)',
          'הוסף לVercel כ-NEXT_PUBLIC_GA4_MEASUREMENT_ID',
          'פרס מחדש — GA4 יתחיל לאסוף נתונים אוטומטית',
        ],
      },
      {
        id: 'gtm',
        name: 'Google Tag Manager',
        description: 'ניהול כל התגיות ממקום אחד',
        logoEmoji: '🏷️',
        pixelConfigured: !!gtmId,
        pixelId: gtmId,
        serverSideConfigured: false,
        fired7d: null,
        deliveryRate: null,
        detailUrl: null,
        envVars: [
          { key: 'NEXT_PUBLIC_GTM_ID', description: 'Container ID מ-Google Tag Manager (GTM-XXXXXXX)', required: true },
        ],
        setupSteps: [
          'היכנס ל-tagmanager.google.com',
          'צור חשבון וContainer חדש לאתר שלך',
          'העתק את ה-Container ID (מתחיל ב-GTM-)',
          'הוסף לVercel כ-NEXT_PUBLIC_GTM_ID',
          'הגדר Tags בתוך GTM לפי הצורך',
        ],
      },
      {
        id: 'gads',
        name: 'Google Ads',
        description: 'מעקב המרות מקמפיינים ממומנים',
        logoEmoji: '🎯',
        pixelConfigured: !!gadsId,
        pixelId: gadsId,
        serverSideConfigured: false,
        fired7d: null,
        deliveryRate: null,
        detailUrl: null,
        envVars: [
          { key: 'NEXT_PUBLIC_GADS_ID', description: 'Conversion ID מ-Google Ads (AW-XXXXXXXXXX)', required: true },
        ],
        setupSteps: [
          'היכנס לGoogle Ads → Tools → Conversions',
          'צור Action המרה חדש עבור "Purchase"',
          'העתק את ה-Conversion ID (AW-XXXXXXXXXX)',
          'הוסף לVercel כ-NEXT_PUBLIC_GADS_ID',
          'בדוק המרות בGoogle Ads לאחר 24 שעות',
        ],
      },
    ],
  })
})
