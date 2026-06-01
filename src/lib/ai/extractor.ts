/**
 * Product Extraction Engine
 * Fetches a product URL and extracts structured data from it.
 * Supports: AliExpress, generic product pages, manual input.
 */

export interface ExtractedProduct {
  title: string
  titleEn: string
  description: string
  images: string[]
  price: number | null     // in ILS/USD as found, or null
  currency: string
  rating: number | null
  reviewCount: number | null
  variants: string[]
  specs: Array<{ label: string; value: string }>
  sourceUrl: string
  sourcePlatform: 'aliexpress' | 'amazon' | 'generic' | 'manual'
}

function extractMeta(html: string, property: string): string {
  const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'))
  return ogMatch?.[1] ?? ''
}

function extractMetaName(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'))
  return m?.[1] ?? ''
}

function extractImages(html: string, baseUrl: string): string[] {
  const imgs: string[] = []

  // OG image
  const ogImg = extractMeta(html, 'og:image')
  if (ogImg) imgs.push(ogImg)

  // JSON-LD images
  const ldMatches = html.matchAll(/"image"\s*:\s*"([^"]+)"/g)
  for (const m of ldMatches) {
    if (m[1].startsWith('http') && !imgs.includes(m[1])) imgs.push(m[1])
  }

  // Large img tags
  const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)
  for (const m of imgTags) {
    let src = m[1]
    if (src.startsWith('//')) src = 'https:' + src
    if (!src.startsWith('http')) continue
    if (src.includes('data:')) continue
    if (!imgs.includes(src) && imgs.length < 10) imgs.push(src)
  }

  return imgs.slice(0, 8)
}

function extractAliExpress(html: string, url: string): Partial<ExtractedProduct> {
  // AliExpress stores product data in window.runParams or similar
  const runParamsMatch = html.match(/window\.runParams\s*=\s*({[\s\S]*?});\s*(?:window|var|let|const|<)/)
  const pageDataMatch = html.match(/data:\s*({[\s\S]{100,5000}?"subject"[\s\S]{0,200}?"salePrice"[\s\S]{0,500}?})/)

  let title = ''
  let price: number | null = null
  let rating: number | null = null
  let reviewCount: number | null = null

  // Try to extract from structured data
  const titleMatch = html.match(/"subject"\s*:\s*"([^"]{5,200})"/)
  if (titleMatch) title = titleMatch[1].replace(/\\u[\da-f]{4}/gi, c => String.fromCharCode(parseInt(c.slice(2), 16)))

  const priceMatch = html.match(/"formattedPrice"\s*:\s*"([^"]+)"/)
    ?? html.match(/"salePrice"\s*:\s*([0-9.]+)/)
  if (priceMatch) price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ''))

  const ratingMatch = html.match(/"averageStarRate"\s*:\s*"?([0-9.]+)"?/)
  if (ratingMatch) rating = parseFloat(ratingMatch[1])

  const reviewMatch = html.match(/"totalValidNum"\s*:\s*([0-9]+)/)
    ?? html.match(/"evaluationStar"\s*:\s*"([^"]+)"/)
  if (reviewMatch) reviewCount = parseInt(reviewMatch[1])

  // Get OG title as fallback
  if (!title) {
    title = extractMeta(html, 'og:title')
      .replace(' - AliExpress', '')
      .replace(' on AliExpress', '')
      .trim()
  }

  return { title, titleEn: title, price, rating, reviewCount, sourcePlatform: 'aliexpress' }
}

function extractGeneric(html: string, url: string): Partial<ExtractedProduct> {
  const title = extractMeta(html, 'og:title')
    || extractMetaName(html, 'title')
    || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
    || ''

  const description = extractMeta(html, 'og:description')
    || extractMetaName(html, 'description')
    || ''

  // Try JSON-LD for price
  let price: number | null = null
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]+?)<\/script>/gi)
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      try {
        const json = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''))
        const p = json?.offers?.price ?? json?.price ?? json?.offers?.[0]?.price
        if (p) { price = parseFloat(String(p)); break }
      } catch { /* skip */ }
    }
  }

  return { title: title.slice(0, 200), titleEn: title.slice(0, 200), description, price, sourcePlatform: 'generic' }
}

export async function extractProductFromUrl(url: string): Promise<ExtractedProduct> {
  const cleanUrl = url.trim()
  const isAliExpress = cleanUrl.includes('aliexpress.com')
  const isAmazon = cleanUrl.includes('amazon.com') || cleanUrl.includes('amazon.co')

  let html = ''
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (res.ok) html = await res.text()
  } catch (err) {
    console.error('[extractor] fetch failed:', err)
  }

  const platform: ExtractedProduct['sourcePlatform'] = isAliExpress ? 'aliexpress' : isAmazon ? 'amazon' : 'generic'
  const specific = isAliExpress ? extractAliExpress(html, cleanUrl) : extractGeneric(html, cleanUrl)
  const images = html ? extractImages(html, cleanUrl) : []

  const description = specific.description
    || extractMeta(html, 'og:description')
    || extractMetaName(html, 'description')
    || ''

  return {
    title: specific.title || 'מוצר',
    titleEn: specific.titleEn || specific.title || 'Product',
    description: description.slice(0, 2000),
    images,
    price: specific.price ?? null,
    currency: specific.currency || 'USD',
    rating: specific.rating ?? null,
    reviewCount: specific.reviewCount ?? null,
    variants: specific.variants || [],
    specs: specific.specs || [],
    sourceUrl: cleanUrl,
    sourcePlatform: platform,
  }
}
