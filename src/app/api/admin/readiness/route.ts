import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import Store from '@/lib/db/models/Store'
import StoreTheme from '@/lib/db/models/StoreTheme'
import { getCardcomConfig, getMetaConfig, getSmtpConfig } from '@/lib/settings/credentials'

export const dynamic = 'force-dynamic'

export interface ReadinessItem {
  id: string
  label: string
  desc: string
  done: boolean
  weight: number
  category: 'brand' | 'product' | 'sales' | 'comms'
  action?: string
  actionLabel?: string
}

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  const storeId = payload?.storeId ?? 'default'

  const [store, productCount, cardcom, meta, smtp, theme] = await Promise.all([
    Store.findOne({ storeId }).lean(),
    Product.countDocuments({ storeId, status: { $in: ['active', 'draft'] } }),
    getCardcomConfig(storeId),
    getMetaConfig(storeId),
    getSmtpConfig(storeId),
    StoreTheme.findOne({ storeId }).lean(),
  ])

  const heroSettings = theme?.sections?.find((s) => s.id === 'hero')?.settings as Record<string, unknown> | undefined

  const items: ReadinessItem[] = [
    // Brand
    {
      id: 'logo_uploaded',
      label: 'לוגו הועלה',
      desc: 'הלוגו שלך מוצג בראש כל דף',
      done: !!(theme?.logoUrl),
      weight: 10,
      category: 'brand',
      action: '/admin/storefront/editor',
      actionLabel: 'העלה לוגו',
    },
    {
      id: 'hero_content',
      label: 'תוכן הכותרת הראשית הוגדר',
      desc: 'הכותרת והתיאור של הדף הראשי',
      done: !!(heroSettings?.headline),
      weight: 10,
      category: 'brand',
      action: '/admin/storefront/editor',
      actionLabel: 'ערוך תוכן',
    },
    {
      id: 'announcement_customized',
      label: 'סרגל מבצע הוגדר',
      desc: 'הכרזה בראש האתר עם מבצע או מסר',
      done: !!(theme?.headerConfig?.announcementText && theme.headerConfig.announcementText !== '🚚 משלוח חינם על כל הזמנה'),
      weight: 5,
      category: 'brand',
      action: '/admin/storefront/editor',
      actionLabel: 'ערוך סרגל',
    },
    // Product
    {
      id: 'product_added',
      label: 'מוצר ראשון הוסף',
      desc: 'לפחות מוצר אחד זמין בחנות',
      done: productCount > 0,
      weight: 20,
      category: 'product',
      action: '/admin/builder',
      actionLabel: 'הוסף מוצר עם AI',
    },
    // Sales
    {
      id: 'payment_connected',
      label: 'תשלום מחובר',
      desc: 'לקוחות יכולים לשלם',
      done: !!(cardcom?.terminal && cardcom?.username),
      weight: 20,
      category: 'sales',
      action: '/admin/payments',
      actionLabel: 'חבר Cardcom',
    },
    {
      id: 'pixel_connected',
      label: 'מעקב מכירות פעיל',
      desc: 'Meta Pixel מחובר לפרסום',
      done: !!(meta?.pixelId),
      weight: 15,
      category: 'sales',
      action: '/admin/marketing/meta',
      actionLabel: 'חבר Meta Pixel',
    },
    // Communication
    {
      id: 'footer_contact',
      label: 'פרטי קשר בפוטר',
      desc: 'אימייל או טלפון לשירות לקוחות',
      done: !!(theme?.footerConfig?.contactEmail || theme?.footerConfig?.contactPhone),
      weight: 10,
      category: 'comms',
      action: '/admin/storefront/editor',
      actionLabel: 'הוסף פרטי קשר',
    },
    {
      id: 'email_connected',
      label: 'מיילים אוטומטיים',
      desc: 'שליחת אישורי הזמנה ללקוחות',
      done: !!(smtp?.user || (smtp as unknown as Record<string, unknown>)?.smtpUser || process.env.SMTP_USER),
      weight: 10,
      category: 'comms',
      action: '/admin/settings',
      actionLabel: 'הגדר SMTP',
    },
  ]

  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  const doneWeight  = items.filter(i => i.done).reduce((sum, i) => sum + i.weight, 0)
  const score       = Math.round((doneWeight / totalWeight) * 100)

  const missing  = items.filter(i => !i.done)
  const nextStep = missing[0] ?? null

  return NextResponse.json({ score, items, nextStep, productCount, storeName: (store as { name?: string } | null)?.name ?? '' })
})
