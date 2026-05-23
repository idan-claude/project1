import { NISToAgorot } from '@/lib/utils/formatPrice'

// USD to NIS exchange rate (update periodically or fetch dynamically)
const USD_TO_NIS = 3.7

export function mapAliexpressProduct(raw: Record<string, unknown>, overrides: {
  nameHe: string
  sellingPriceNIS: number
  costPriceUSD: number
  categoryId?: string
}) {
  const costAgorot = NISToAgorot(overrides.costPriceUSD * USD_TO_NIS)
  const sellingAgorot = NISToAgorot(overrides.sellingPriceNIS)

  const images = extractImages(raw)

  return {
    nameHe: overrides.nameHe,
    nameEn: (raw.subject as string) || '',
    descriptionHe: '',
    images,
    category: overrides.categoryId || undefined,
    pricing: {
      costPrice: costAgorot,
      sellingPrice: sellingAgorot,
      compareAtPrice: 0,
      vatIncluded: true,
    },
    inventory: {
      trackQuantity: false,
      quantity: 999,
      lowStockThreshold: 5,
    },
    status: 'draft',
    aliexpressData: {
      productId: String(raw.product_id || raw.productId || ''),
      sourceUrl: (raw.product_detail_url as string) || '',
      lastSynced: new Date(),
    },
  }
}

function extractImages(raw: Record<string, unknown>) {
  // Try various AliExpress API response shapes
  const mainImage = raw.product_main_image_url || raw.imageUrl
  if (mainImage) return [{ url: mainImage as string, alt: '' }]

  const imageModule = raw.aeop_ae_product_s_k_us_dto || raw.imageModule
  if (imageModule && typeof imageModule === 'object') {
    const urls = (imageModule as Record<string, unknown>).image_urls ||
                 (imageModule as Record<string, unknown>).imagePathList
    if (Array.isArray(urls)) return urls.map((u: string) => ({ url: u, alt: '' }))
  }
  return []
}
