import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import { generateProductContent } from '@/lib/ai/generator'
import type { ExtractedProduct } from '@/lib/ai/extractor'

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    await connectDB()
    const storeId = getAdminPayload(req)?.storeId ?? 'default'
    const { product: extracted } = await req.json() as { product: ExtractedProduct }

    if (!extracted) return NextResponse.json({ error: 'נתוני מוצר נדרשים' }, { status: 400 })

    const content = await generateProductContent(extracted)

    // Build a slug from the product name
    const slug = (content.nameHe || extracted.title || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9֐-׿\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 6)

    // Save to Product model
    const product = await Product.create({
      storeId,
      title: content.nameHe || extracted.title,
      slug,
      subtitle: content.subtitle,
      description: content.descriptionHe,
      descriptionShort: content.descriptionShort,
      price: content.suggestedPrice ?? (extracted.price ? Math.round(extracted.price * 3.7 * 100 * 2.5) : null),
      compareAtPrice: content.suggestedCompareAtPrice ?? null,
      images: extracted.images,
      status: 'draft',
      benefitsList: content.benefitsList,
      ctaText: content.ctaText,
      addToCartText: content.addToCartText,
      sourceUrl: extracted.sourceUrl,
      sourcePlatform: extracted.sourcePlatform,
      pageContent: {
        features: content.features,
        faqs: content.faqs,
        guaranteeText: content.guaranteeText,
        shippingText: content.shippingText,
        urgencyText: content.urgencyText,
        trustBadges: content.trustBadges,
      },
      seo: {
        title: content.seoTitle,
        description: content.seoDescription,
      },
    })

    return NextResponse.json({ product, content })
  } catch (err) {
    console.error('[builder/generate]', err)
    return NextResponse.json({ error: 'שגיאה ביצירת תוכן AI' }, { status: 500 })
  }
})
