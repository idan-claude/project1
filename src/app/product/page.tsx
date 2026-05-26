import type { Metadata } from 'next'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import Review from '@/lib/db/models/Review'
import PageLayout, { DEFAULT_SECTIONS } from '@/lib/db/models/PageLayout'
import ProductClient from './ProductClient'
import type { ProductBundle, ProductPageContent, ReviewItem, ProductSection } from './ProductClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PRODUCT_SLUG = 'kartis-maakav-smart-pro'

const FALLBACK_GALLERY = [
  '/images/product-1-hero.svg',
  '/images/product-2-wallet.svg',
  '/images/product-3-bundle.svg',
  '/images/product-4-features.svg',
]

const FALLBACK_FEATURES = [
  { icon: '📡', label: 'רשת Apple Find My', desc: 'מעל 500 מיליון מכשיר' },
  { icon: '💳', label: 'עובי 1.8 מ"מ', desc: 'נכנס לכל ארנק' },
  { icon: '🔋', label: 'סוללה 8 חודשים', desc: 'טעינה אלחוטית' },
  { icon: '🌊', label: 'עמיד מים IP67', desc: 'גשם, שלג, לחות' },
  { icon: '🔊', label: 'התראה קולית', desc: 'עד 30 מטר' },
  { icon: '⚡', label: 'הגדרה תוך 30 שניות', desc: 'בלי הורדות' },
]

const FALLBACK_FAQS = [
  { q: 'איך FindCard עובד?', a: 'FindCard משתמש ב-Bluetooth 5.1 ומתחבר לרשת ה-Find My של Apple. כל iPhone בסביבה מדווח על מיקום הכרטיס לשרתי Apple, ואתה מקבל את המיקום המדויק דרך האפליקציה.' },
  { q: 'האם זה עובד עם אנדרואיד?', a: 'כרגע רק עם Apple — iPhone ו-iPad עם iOS 14.5 ומעלה. גרסת אנדרואיד בפיתוח.' },
  { q: 'כמה עבה הכרטיס?', a: 'בדיוק 1.8 מ"מ — אותו עובי של כרטיס אשראי. נכנס לכל תא כרטיסים, בכל ארנק.' },
  { q: 'כמה זמן הסוללה מחזיקה?', a: 'עד 8 חודשים בשימוש יומיומי. טעינה אלחוטית Qi — מניחים על משטח ותוך שעתיים מלא.' },
  { q: 'האם הכרטיס עמיד במים?', a: 'כן! IP67 — עמיד בשקיעה עד 1 מטר למשך 30 דקות. עמיד גם בגשם, שלג ולחות.' },
  { q: 'מה כוללת האחריות?', a: 'אחריות לכל החיים על פגמי ייצור + 100 יום החזר כסף מלא אם לא מרוצה מכל סיבה. בלי שאלות.' },
]

const FALLBACK_REVIEWS: ReviewItem[] = [
  { photo: 'https://i.pravatar.cc/80?img=9', name: 'דנה כ.', location: 'תל אביב', detail: 'לקוחה 4 חודשים', rating: 5, text: 'שנתיים ממש הייתי מאבדת ארנק כל שבוע, פעמיים שלוש פעמים. מאז שהכנסתי את FindCard? לא חיפשתי פעם אחת. ממש ממליצה 🙏' },
  { photo: 'https://i.pravatar.cc/80?img=33', name: 'אבי מ.', location: 'חיפה', detail: 'קנה 3 יחידות · לקוח 6 חודשים', rating: 5, text: 'קניתי 3 — לי, לאשה ולבן שמאבד הכל. הבן "איבד" ילקוט בבית ספר ומצאנו אותו תוך דקה!! ממליץ בחום לכל המשפחה.' },
  { photo: 'https://i.pravatar.cc/80?img=26', name: 'שירה ל.', location: 'ירושלים', detail: 'לקוחה 5 חודשים', rating: 5, text: 'טסתי לאמסטרדם ואיבדתי מזוודה בפרנקפורט. ידעתי בדיוק שהיא שם! הראיתי לשירות לקוחות את המפה ושלחו אליי. הציל לי את החופשה ממש.' },
  { photo: 'https://i.pravatar.cc/80?img=44', name: 'מרים ה.', location: 'נתניה', detail: 'קנתה לאמא · לקוחה 5 חודשים', rating: 5, text: 'קניתי לאמא שלי בת ה-78 שמאבדת ארנק כל יום. פשוט מתקשרים אליה ומוצאים דרך הטלפון שלנו. שלום נפשי לכל המשפחה!' },
  { photo: 'https://i.pravatar.cc/80?img=63', name: 'נועה ג.', location: 'הרצליה', detail: 'לקוחה 3 חודשים', rating: 4, text: 'קיבלתי במתנה ולא ידעתי אם אשתמש. חודש אחרי — ארנק נפל מהתיק בקניון, Find My הראה שהוא עדיין שם. חזרתי ומצאתי. חסכתי כ-750 שקל.' },
  { photo: 'https://i.pravatar.cc/80?img=17', name: 'תומר ז.', location: 'גבעתיים', detail: 'לקוח חודשיים', rating: 3, text: 'עובד כמו שאמרו. ההגדרה הייתה קצת מבלבלת בהתחלה אבל אחרי 5 דקות הסתדרתי. המשלוח לקח כשבועיים. בסך הכל מרוצה' },
  { photo: 'https://i.pravatar.cc/80?img=5', name: 'יוסי ב.', location: 'ראשון לציון', detail: 'קנה 2 יחידות · לקוח 7 חודשים', rating: 5, text: 'בחיים מאבד מפתחות, רציני. אחרי FindCard לוחץ וביפ! מצא. חסך לי כבר 3 כפילות (כל אחד 150 שח אז תחשבו...) שווה כל אגורה' },
  { photo: 'https://i.pravatar.cc/80?img=12', name: 'רחל ס.', location: 'באר שבע', detail: 'לקוחה 8 חודשים', rating: 5, text: 'הכרטיס ממש דק ולא מורגש כלל בארנק. שכחתי שהוא שם עד שארנק נפל בסופר ומצאתי אותו תוך 30 שניות. מעולה.' },
  { photo: 'https://i.pravatar.cc/80?img=21', name: 'גל ד.', location: 'פתח תקווה', detail: 'לקוחה 3 חודשים', rating: 5, text: 'קניתי לבעל שלי שמאבד הכל תמיד. השינוי דרמטי. הוא אפילו לא מאמין שמצא את הארנק לבד :-) תודה רבה!' },
  { photo: 'https://i.pravatar.cc/80?img=52', name: 'עמית כ.', location: 'כפר סבא', detail: 'לקוח 5 חודשים', rating: 4, text: 'מוצר טוב מאוד. הייתי סקפטי בהתחלה אבל זה באמת עובד. פעם אחת הצג הראה שהארנק "50 מטר" ומצאתי אותו בין כריות הספה 😅' },
  { photo: 'https://i.pravatar.cc/80?img=38', name: 'ליאת מ.', location: 'רמת גן', detail: 'קנתה לבן זוג · לקוחה 6 חודשים', rating: 5, text: 'קניתי לבן זוג ליום הולדת — הוא היה מרוגז ש"קיבל מתנה פרקטית" אבל אחרי שבוע שלח לי תודה עם 3 לבבות כי מצא ארנק שאיבד 😄' },
  { photo: 'https://i.pravatar.cc/80?img=57', name: 'ניר ש.', location: 'אשדוד', detail: 'לקוח 4 חודשים', rating: 5, text: 'אני נהג מסירות ומאבד מפתחות רכב כמה פעמים בחודש. מאז FindCard לא היו לי עיכובים בגלל מפתחות. ממליץ לכל מי שעובד בשטח' },
  { photo: 'https://i.pravatar.cc/80?img=41', name: 'חנה א.', location: 'חולון', detail: 'קנתה לאבא · לקוחה 9 חודשים', rating: 5, text: 'קניתי לאבא בן ה-82. כל שבוע היינו מחפשים לו ארנק בכל הבית. עכשיו הוא לוחץ על הכפתור והכרטיס מצפצף. הוא כל כך מאושר.' },
  { photo: 'https://i.pravatar.cc/80?img=30', name: 'יעל פ.', location: 'גבעת שמואל', detail: 'לקוחה 5 חודשים', rating: 5, text: 'AirTag היה גדול מדי לארנק שלי. FindCard נכנס כמו כרטיס אשראי רגיל. 5 חודשים ולא הפסדתי ארנק אחד. זהו. תגמרו לחשוב ותקנו.' },
  { photo: 'https://i.pravatar.cc/80?img=13', name: 'ערן ט.', location: 'נס ציונה', detail: 'לקוח שנה', rating: 5, text: 'שנה שלמה ועדיין עובד מצוין. הסוללה עדיין מחזיקה חזק. המוצר הכי שווה שקניתי השנה בלי ספק. 10/10' },
  { photo: 'https://i.pravatar.cc/80?img=68', name: 'טל ר.', location: 'אילת', detail: 'לקוח 6 חודשים', rating: 5, text: 'גרתי באילת ואיבדתי ארנק בים. חששתי שהמים יהרסו אותו אבל IP67 — הכרטיס חי! הוא צפצף גם אחרי שעה במים. מדהים ממש.' },
]

export async function generateMetadata(): Promise<Metadata> {
  await connectDB()
  const p = await Product.findOne({ slug: PRODUCT_SLUG, status: 'active' })
    .select('nameHe descriptionShort ogImage seo pricing')
    .lean() as {
      nameHe: string
      descriptionShort?: string
      ogImage?: string
      seo?: { metaTitle?: string; metaDescription?: string }
      pricing: { sellingPrice: number }
    } | null

  if (!p) return { title: 'מוצר לא נמצא' }

  const title = p.seo?.metaTitle || p.nameHe
  const description = p.seo?.metaDescription || p.descriptionShort || ''
  const image = p.ogImage || FALLBACK_GALLERY[0]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: 'website',
      locale: 'he_IL',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

// Round to nearest ₪x.90 for psychological pricing defaults
function psychoPrice(n: number): number {
  return Math.round(n / 1000) * 1000 - 10
}

function buildDefaultBundles(sellingPrice: number, compareAtPrice: number): ProductBundle[] {
  const c1 = compareAtPrice || psychoPrice(sellingPrice * 1.5)
  return [
    { title: 'כרטיס 1', quantity: 1, price: sellingPrice, compareAtPrice: c1, badge: null, badgeColor: '', isRecommended: false, benefits: [] },
    { title: '2 כרטיסים + 1 חינם', quantity: 3, price: psychoPrice(sellingPrice * 1.5), compareAtPrice: 3 * sellingPrice, badge: '72% מהלקוחות', badgeColor: 'bg-blue-600', isRecommended: true, benefits: [] },
    { title: '3 כרטיסים + 1 חינם', quantity: 4, price: psychoPrice(sellingPrice * 1.9), compareAtPrice: 4 * sellingPrice, badge: 'הכי משתלם!', badgeColor: 'bg-orange-500', isRecommended: false, benefits: [] },
  ]
}

export default async function ProductPage() {
  await connectDB()

  const [productRaw, reviewsRaw, layoutRaw] = await Promise.all([
    Product.findOne({ slug: PRODUCT_SLUG, status: 'active' }).lean(),
    Review.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(20).lean(),
    PageLayout.findOne({ productId: null }).lean().catch(() => null), // global default first
  ])

  if (!productRaw) notFound()

  // Fetch product-specific layout (overrides global)
  const productLayoutRaw = await PageLayout.findOne({ productId: productRaw._id }).lean().catch(() => null)
  const activeLayout = productLayoutRaw ?? layoutRaw
  const sections: ProductSection[] = activeLayout?.sections?.length
    ? (activeLayout.sections as ProductSection[])
    : DEFAULT_SECTIONS

  const product = productRaw as {
    _id: { toString(): string }
    slug: string
    nameHe: string
    subtitle?: string
    descriptionShort?: string
    benefitsList?: string[]
    ctaText?: string
    addToCartText?: string
    videoUrl?: string
    ogImage?: string
    beforeAfter?: { before: string; after: string; label: string }[]
    seo?: { metaTitle?: string; metaDescription?: string }
    pricing: { sellingPrice: number; compareAtPrice: number }
    images?: { url: string }[]
    inventory?: { trackQuantity: boolean; quantity: number }
    bundles?: {
      title: string; quantity: number; price: number; compareAtPrice: number
      badge?: string; badgeColor?: string; isRecommended?: boolean
      benefits?: string[]; imageOverride?: string; active?: boolean
    }[]
    pageContent?: {
      features?: { icon: string; label: string; desc: string }[]
      faqs?: { q: string; a: string }[]
      urgencyText?: string; shippingText?: string; guaranteeText?: string
      reviewRating?: number; reviewCount?: number
      trustBadges?: { icon: string; text: string }[]
    }
  }

  const gallery = product.images?.length ? product.images.map(img => img.url) : FALLBACK_GALLERY
  const inStock = !product.inventory?.trackQuantity || product.inventory.quantity > 0

  // Bundles: use DB bundles if set, otherwise generate psychological-price defaults
  const activeBundles = product.bundles?.filter(b => b.active !== false) ?? []
  const bundles: ProductBundle[] = activeBundles.length > 0
    ? activeBundles.map(b => ({
        title: b.title,
        quantity: b.quantity,
        price: b.price,
        compareAtPrice: b.compareAtPrice,
        badge: b.badge || null,
        badgeColor: b.badgeColor || 'bg-blue-600',
        isRecommended: b.isRecommended ?? false,
        benefits: b.benefits ?? [],
        imageOverride: b.imageOverride || '',
      }))
    : buildDefaultBundles(product.pricing.sellingPrice, product.pricing.compareAtPrice)

  // Page content: use DB values, fall back to defaults for missing fields
  const pc = product.pageContent ?? {}
  const pageContent: ProductPageContent = {
    features: pc.features?.length ? pc.features : FALLBACK_FEATURES,
    faqs: pc.faqs?.length ? pc.faqs : FALLBACK_FAQS,
    urgencyText: pc.urgencyText || '',
    shippingText: pc.shippingText || '',
    guaranteeText: pc.guaranteeText || '',
    reviewRating: pc.reviewRating ?? 0,
    reviewCount: pc.reviewCount ?? 0,
    trustBadges: pc.trustBadges?.length ? pc.trustBadges : [],
  }

  // Reviews: use approved DB reviews if any, fall back to hardcoded samples
  const reviews: ReviewItem[] = reviewsRaw.length > 0
    ? (reviewsRaw as { customer: { name: string }; rating: number; text: string }[]).map(r => ({
        name: r.customer.name,
        rating: r.rating,
        text: r.text,
      }))
    : FALLBACK_REVIEWS

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nameHe,
    description: product.descriptionShort || '',
    image: gallery[0],
    offers: {
      '@type': 'Offer',
      price: (product.pricing.sellingPrice / 100).toFixed(2),
      priceCurrency: 'ILS',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient
        productId={product._id.toString()}
        slug={product.slug}
        nameHe={product.nameHe}
        gallery={gallery}
        bundles={bundles}
        inStock={inStock}
        pageContent={pageContent}
        reviews={reviews}
      />
    </>
  )
}
