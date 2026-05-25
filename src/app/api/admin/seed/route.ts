import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

// Seeds the main FindCard PRO product if it doesn't exist
export const POST = withAdminAuth(async () => {
  await connectDB()

  const existing = await Product.findById('kartis-maakav-smart-pro').catch(() => null)
    || await Product.findOne({ slug: 'kartis-maakav-smart-pro' })

  if (existing) {
    return NextResponse.json({ seeded: false, message: 'המוצר כבר קיים', id: existing._id })
  }

  const product = await Product.create({
    slug: 'kartis-maakav-smart-pro',
    nameHe: 'כרטיס מעקב FindCard PRO',
    nameEn: 'FindCard PRO Tracking Card',
    descriptionHe: 'כרטיס מעקב חכם בעובי 1.8 מ"מ, תואם Apple Find My. עמיד מים IP67, סוללה 8 חודשים, טעינה אלחוטית Qi.',
    images: [
      { url: '/images/product-1-hero.svg', alt: 'FindCard PRO' },
      { url: '/images/product-2-wallet.svg', alt: 'FindCard PRO בארנק' },
      { url: '/images/product-3-bundle.svg', alt: 'FindCard PRO חבילה' },
      { url: '/images/product-4-features.svg', alt: 'FindCard PRO פיצ׳רים' },
    ],
    pricing: {
      costPrice: 3000,        // ₪30 (agorot)
      sellingPrice: 19990,    // ₪199.90
      compareAtPrice: 29890,  // ₪298.90
      vatIncluded: true,
    },
    inventory: {
      trackQuantity: true,
      quantity: 500,
      lowStockThreshold: 20,
    },
    status: 'active',
    featured: true,
    sku: 'FC-PRO-001',
    weight: 7,
    tags: ['מעקב', 'ארנק', 'apple', 'find my', 'bluetooth'],
  })

  return NextResponse.json({ seeded: true, message: 'מוצר נוצר בהצלחה', id: product._id })
})
