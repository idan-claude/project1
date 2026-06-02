import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import Store from '@/lib/db/models/Store'
import { getCardcomConfig, getMetaConfig, getSmtpConfig } from '@/lib/settings/credentials'

export const dynamic = 'force-dynamic'

interface ReadinessItem {
  id: string
  label: string
  done: boolean
  weight: number
  action?: string
  actionLabel?: string
}

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const payload = getAdminPayload(req)
  const storeId = payload?.storeId ?? 'default'

  const [store, productCount, cardcom, meta, smtp] = await Promise.all([
    Store.findOne({ storeId }).lean(),
    Product.countDocuments({ storeId, status: { $in: ['active', 'draft'] } }),
    getCardcomConfig(storeId),
    getMetaConfig(storeId),
    getSmtpConfig(storeId),
  ])

  const items: ReadinessItem[] = [
    {
      id: 'store_created',
      label: 'חנות נוצרה',
      done: !!store,
      weight: 10,
    },
    {
      id: 'product_added',
      label: 'מוצר ראשון הוסף',
      done: productCount > 0,
      weight: 20,
      action: '/admin/builder',
      actionLabel: 'הוסף מוצר עם AI',
    },
    {
      id: 'payment_connected',
      label: 'תשלום מחובר',
      done: !!(cardcom?.terminal && cardcom?.username),
      weight: 25,
      action: '/admin/payments',
      actionLabel: 'חבר Cardcom',
    },
    {
      id: 'design_customized',
      label: 'עיצוב החנות הוגדר',
      done: false, // will be true when StoreTheme has been saved with non-default values
      weight: 15,
      action: '/admin/storefront/editor',
      actionLabel: 'עצב את החנות',
    },
    {
      id: 'pixel_connected',
      label: 'מעקב מכירות פעיל',
      done: !!(meta?.pixelId),
      weight: 20,
      action: '/admin/marketing/meta',
      actionLabel: 'חבר Meta Pixel',
    },
    {
      id: 'email_connected',
      label: 'מיילים אוטומטיים',
      done: !!(smtp?.host && smtp?.user),
      weight: 10,
      action: '/admin/settings/integrations',
      actionLabel: 'הגדר מיילים',
    },
  ]

  // Check if theme has been customized
  try {
    const StoreTheme = (await import('@/lib/db/models/StoreTheme')).default
    const theme = await StoreTheme.findOne({ storeId }).lean() as { status?: string } | null
    if (theme) {
      items.find(i => i.id === 'design_customized')!.done = theme.status === 'published' || !!theme
    }
  } catch { /* StoreTheme optional */ }

  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  const doneWeight = items.filter(i => i.done).reduce((sum, i) => sum + i.weight, 0)
  const score = Math.round((doneWeight / totalWeight) * 100)

  const missing = items.filter(i => !i.done)
  const nextStep = missing[0] ?? null

  return NextResponse.json({ score, items, nextStep, productCount })
})
