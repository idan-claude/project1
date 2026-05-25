import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import ProductClient from './ProductClient'
import type { ProductTier } from './ProductClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PRODUCT_SLUG = 'kartis-maakav-smart-pro'

const FALLBACK_GALLERY = [
  '/images/product-1-hero.svg',
  '/images/product-2-wallet.svg',
  '/images/product-3-bundle.svg',
  '/images/product-4-features.svg',
]

function roundTo10(n: number): number {
  return Math.round(n / 1000) * 1000
}

function buildTiers(basePrice: number, compareAtPrice: number): ProductTier[] {
  const c1 = compareAtPrice || Math.round(basePrice * 1.5)
  return [
    { actualCards: 1, label: 'כרטיס 1', sublabel: '', price: basePrice, compareAt: c1, badge: null, badgeColor: '' },
    { actualCards: 3, label: '2 כרטיסים + 1 חינם', sublabel: 'סה"כ 3 כרטיסים', price: roundTo10(basePrice * 1.5), compareAt: 3 * basePrice, badge: '72% מהלקוחות', badgeColor: 'bg-blue-600' },
    { actualCards: 4, label: '3 כרטיסים + 1 חינם', sublabel: 'סה"כ 4 כרטיסים', price: roundTo10(basePrice * 1.9), compareAt: 4 * basePrice, badge: 'הכי משתלם!', badgeColor: 'bg-orange-500' },
  ]
}

export default async function ProductPage() {
  await connectDB()
  const product = await Product.findOne({ slug: PRODUCT_SLUG, status: 'active' }).lean() as {
    _id: { toString(): string }
    slug: string
    nameHe: string
    pricing: { sellingPrice: number; compareAtPrice: number }
    images?: { url: string }[]
    inventory?: { trackQuantity: boolean; quantity: number }
  } | null

  if (!product) notFound()

  const tiers = buildTiers(product.pricing.sellingPrice, product.pricing.compareAtPrice)
  const gallery = product.images?.length ? product.images.map(img => img.url) : FALLBACK_GALLERY
  const inStock = !product.inventory?.trackQuantity || product.inventory.quantity > 0

  return (
    <ProductClient
      productId={product._id.toString()}
      slug={product.slug}
      nameHe={product.nameHe}
      gallery={gallery}
      tiers={tiers}
      inStock={inStock}
    />
  )
}
