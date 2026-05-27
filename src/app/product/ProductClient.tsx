'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'
import { track, trackPageView, trackScrollDepth, trackRageClicks, trackInactivity } from '@/lib/tracking/tracker'

export interface ProductBundle {
  title: string
  quantity: number
  price: number
  compareAtPrice: number
  badge: string | null
  badgeColor: string
  isRecommended: boolean
  benefits: string[]
  imageOverride?: string
}

export interface ProductPageContent {
  features: { icon: string; label: string; desc: string }[]
  faqs: { q: string; a: string }[]
  urgencyText: string
  shippingText: string
  guaranteeText: string
  reviewRating: number
  reviewCount: number
  trustBadges: { icon: string; text: string }[]
}

export interface ReviewItem {
  name: string
  location?: string
  detail?: string
  photo?: string
  rating: number
  text: string
}

export interface ProductSection {
  type: string
  enabled: boolean
  order: number
}

export interface ProductData {
  productId: string
  slug: string
  nameHe: string
  subtitle?: string
  descriptionShort?: string
  benefitsList?: string[]
  ctaText?: string
  addToCartText?: string
  videoUrl?: string
  beforeAfter?: { before: string; after: string; label: string }[]
  gallery: string[]
  bundles: ProductBundle[]
  inStock: boolean
  pageContent: ProductPageContent
  reviews: ReviewItem[]
  carouselReviews?: ReviewItem[]
  sections?: ProductSection[]
}

function priceDisplay(agorot: number): string {
  const n = agorot / 100
  return `₪${Number.isInteger(n) ? n.toLocaleString('he-IL') : n.toFixed(2)}`
}

function ReviewCarousel({ reviews }: { reviews: ReviewItem[] }) {
  const [idx, setIdx] = useState(0)
  const touchStart = useRef(0)
  const count = Math.min(reviews.length, 3)

  function handleTouchStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 35) setIdx(i => diff > 0 ? (i + 1) % count : (i - 1 + count) % count)
  }

  if (!reviews.length) return null
  const r = reviews[idx]
  const initials = r.name.slice(0, 2)

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 select-none" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex items-start gap-2.5">
        {r.photo
          ? <img src={r.photo} alt={r.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white shadow-sm" />
          : <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-800">{initials}</div>
        }
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-yellow-400 text-xs">{'★'.repeat(r.rating)}</span>
            <span className="text-xs text-gray-600 font-semibold">{r.name}</span>
            <span className="text-xs text-green-600 font-medium">מאומת ✓</span>
          </div>
          <p className="text-xs text-gray-700 leading-snug line-clamp-2">&ldquo;{r.text}&rdquo;</p>
        </div>
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: count }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-200 ${idx === i ? 'w-4 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-amber-300/70'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductClient({ productId, slug, nameHe, subtitle, benefitsList, ctaText, addToCartText, videoUrl, beforeAfter, gallery, bundles, inStock, pageContent, reviews, carouselReviews, sections }: ProductData) {
  const [bundleIndex, setBundleIndex] = useState(() => {
    const recommended = bundles.findIndex(b => b.isRecommended)
    return recommended >= 0 ? recommended : Math.min(1, bundles.length - 1)
  })
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const imgTouchStart = useRef(0)
  const addItem = useCartStore(s => s.addItem)
  const router = useRouter()

  useEffect(() => {
    trackPageView()
    track('product_view', { product: slug })
    const cleanScroll = trackScrollDepth()
    const cleanRage = trackRageClicks()
    const cleanInactive = trackInactivity(30000)

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        track('exit_page', { product: slug, path: window.location.pathname })
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cleanScroll?.()
      cleanRage?.()
      cleanInactive?.()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [slug])

  const bundle = bundles[bundleIndex]
  const saveAmount = bundle.compareAtPrice - bundle.price
  const savePercent = bundle.compareAtPrice > 0 ? Math.round((saveAmount / bundle.compareAtPrice) * 100) : 0
  const pricePerUnit = Math.round(bundle.price / bundle.quantity)

  // Use bundle image override if set, otherwise use gallery
  const displayImage = bundle.imageOverride || gallery[activeImg]

  function addCartItem() {
    addItem({ productId, slug, nameHe: `${nameHe} — ${bundle.title}`, image: gallery[0] ?? '', sellingPrice: bundle.price, quantity: 1, variantLabel: bundle.title })
  }
  function handleAdd() {
    addCartItem()
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    track('add_to_cart', { product: slug, bundle: bundle.title, price: bundle.price })
  }
  function handleBuyNow() {
    track('cta_click', { button: 'buy_now', bundle: bundle.title, price: bundle.price, product: slug })
    addCartItem()
    router.push('/checkout')
  }

  function setActiveImgTracked(i: number) {
    setActiveImg(i)
    track('gallery_view', { imageIndex: i, product: slug })
  }

  function imgSwipe(e: React.TouchEvent, type: 'start' | 'end') {
    if (type === 'start') { imgTouchStart.current = e.touches[0].clientX; return }
    const diff = imgTouchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      // Compute next outside setState to avoid double-firing in Strict Mode
      setActiveImg(i => {
        const next = diff > 0 ? (i + 1) % gallery.length : (i - 1 + gallery.length) % gallery.length
        return next
      })
      const currentImg = activeImg
      const next = diff > 0 ? (currentImg + 1) % gallery.length : (currentImg - 1 + gallery.length) % gallery.length
      track('gallery_view', { imageIndex: next, product: slug })
    }
  }

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 6)
  const reviewRating = pageContent.reviewRating || (reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0)
  const reviewCount = pageContent.reviewCount || reviews.length
  const ratingDisplay = reviewRating > 0 ? reviewRating.toFixed(1) : null

  const urgencyText = pageContent.urgencyText || 'מבצע מוגבל: 24 שעות אחרונות למחיר הזה!'
  const shippingText = pageContent.shippingText || 'מגיע תוך 7–14 ימי עסקים · מספר מעקב במייל'
  const guaranteeText = pageContent.guaranteeText || 'אחריות לכל החיים + 100 יום החזר כסף מלא — בלי שאלות'
  const trustBadges = pageContent.trustBadges?.length ? pageContent.trustBadges : [
    { icon: '🛡️', text: 'אחריות\nלכל החיים' },
    { icon: '🚚', text: 'משלוח חינם\nלכל הארץ' },
    { icon: '🔒', text: 'תשלום\nמאובטח SSL' },
  ]
  const buyNowText = ctaText || 'קנה עכשיו ←'
  const addToCartLabel = addToCartText || 'הוסף לסל 🛒'

  // Section ordering helpers
  const orderedSections = sections?.slice().sort((a, b) => a.order - b.order) ?? []
  function isSectionEnabled(type: string): boolean {
    if (!sections?.length) return true
    const s = sections.find(x => x.type === type)
    return s ? s.enabled : true
  }
  // Below-fold section types in their configured order
  const belowFoldTypes = ['benefits', 'reviews', 'faq', 'video', 'before_after', 'custom_text']
  const belowFoldOrder = orderedSections.length
    ? orderedSections.filter(s => belowFoldTypes.includes(s.type) && s.enabled).map(s => s.type)
    : belowFoldTypes

  // YouTube/Vimeo: convert watch URL to embed URL
  function toEmbedUrl(url: string): string {
    if (!url) return ''
    if (url.includes('youtube.com/watch')) return url.replace('watch?v=', 'embed/')
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/')
    return url
  }

  function BundleSelector() {
    return (
      <div className="space-y-2.5">
        {bundles.map((b, i) => {
          const sel = bundleIndex === i
          const pct = b.compareAtPrice > 0 ? Math.round(((b.compareAtPrice - b.price) / b.compareAtPrice) * 100) : 0
          return (
            <button key={i} onClick={() => setBundleIndex(i)}
              className={`w-full text-right rounded-2xl px-4 py-3 transition-all relative border-2 ${sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              {b.badge && (
                <span className={`absolute -top-2.5 right-3 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ${b.badgeColor || 'bg-blue-600'}`}>{b.badge}</span>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-blue-600' : 'border-gray-300'}`}>
                    {sel && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{b.title}</p>
                    {b.quantity > 1 && <p className="text-xs text-gray-400">סה&quot;כ {b.quantity} כרטיסים</p>}
                    {b.benefits?.length > 0 && (
                      <p className="text-xs text-green-600 mt-0.5">{b.benefits[0]}</p>
                    )}
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-lg font-black leading-none ${sel ? 'text-blue-600' : 'text-gray-900'}`}>{priceDisplay(b.price)}</p>
                  {b.compareAtPrice > 0 && <p className="text-xs text-gray-400 line-through">{priceDisplay(b.compareAtPrice)}</p>}
                  {pct > 0 && <p className="text-xs font-bold text-green-600">-{pct}%</p>}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Header />

      {/* Sticky buy bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">{bundle.title}</p>
            <p className="text-lg font-black text-blue-700 leading-tight">{priceDisplay(bundle.price)}</p>
          </div>
          <button onClick={handleBuyNow} className="bg-blue-700 text-white font-extrabold px-5 py-3 rounded-xl text-sm shadow-lg flex-shrink-0">{buyNowText}</button>
          <button onClick={handleAdd} className="bg-white border-2 border-blue-600 text-blue-600 font-bold px-4 py-3 rounded-xl text-sm flex-shrink-0">{added ? '✓' : '🛒'}</button>
        </div>
      </div>

      <main className="flex-1 pb-24 lg:pb-0">

        {/* ═══ MOBILE LAYOUT ═══ */}
        <div className="lg:hidden">
          <div className="relative bg-[#0C1020] select-none" onTouchStart={e => imgSwipe(e, 'start')} onTouchEnd={e => imgSwipe(e, 'end')}>
            <img src={displayImage} alt={nameHe} className="w-full aspect-square object-cover" />
            <div dir="ltr" className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-2 pt-6 bg-gradient-to-t from-[#0C1020]/80 to-transparent">
              {gallery.map((src, i) => (
                <button key={i} onClick={() => setActiveImgTracked(i)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-blue-400 opacity-100' : 'border-transparent opacity-50'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover bg-[#0C1020]" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {ratingDisplay && <><span className="text-yellow-400 text-sm font-bold">★★★★★</span><span className="text-xs text-gray-500">{ratingDisplay} · {reviewCount} ביקורות</span></>}
                <span className={`${ratingDisplay ? 'mr-auto' : ''} text-xs font-bold px-2 py-0.5 rounded-full ${inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inStock ? 'במלאי ✓' : 'אזל המלאי'}</span>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 leading-snug">{nameHe}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-1 leading-snug">{subtitle}</p>}
            </div>

            {(carouselReviews?.length ?? 0) > 0 && <ReviewCarousel reviews={carouselReviews!} />}

            {benefitsList && benefitsList.length > 0 && (
              <ul className="space-y-1">
                {benefitsList.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">בחר חבילה:</p>
              <BundleSelector />
            </div>

            {isSectionEnabled('urgency') && (
              <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                <span>🔥</span>
                <span><strong>מבצע מוגבל:</strong> {urgencyText}</span>
              </div>
            )}

            <div>
              <div className="flex items-baseline gap-2 mb-2.5">
                <span className="text-3xl font-black text-blue-700">{priceDisplay(bundle.price)}</span>
                {bundle.compareAtPrice > 0 && <><span className="text-gray-400 line-through text-base">{priceDisplay(bundle.compareAtPrice)}</span><span className="text-sm font-bold text-green-600">חסכת {priceDisplay(saveAmount)}</span></>}
              </div>
              <button onClick={handleBuyNow} className="w-full bg-blue-700 text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg mb-2 hover:bg-blue-800 transition-colors">
                {buyNowText} {priceDisplay(bundle.price)}
              </button>
              <button onClick={handleAdd} className="w-full bg-white text-blue-600 border-2 border-blue-600 font-bold py-3 rounded-2xl text-base hover:bg-blue-50 transition-colors">
                {added ? '✓ נוסף לסל! 🛒' : addToCartLabel}
              </button>
            </div>

            <div className="flex justify-around text-xs text-gray-500 py-1 border-t border-gray-100">
              {trustBadges.slice(0, 3).map(b => (
                <span key={b.text}>{b.icon} {b.text.split('\n')[0]}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ DESKTOP LAYOUT ═══ */}
        <div className="hidden lg:block">
          <div className="bg-gray-50 border-b">
            <div className="max-w-6xl mx-auto px-8 py-3 text-sm text-gray-500">
              <Link href="/" className="hover:text-blue-600">בית</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">{nameHe}</span>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-8 py-10">
            <div className="grid grid-cols-2 gap-12 items-start">
              <div className="sticky top-24 space-y-4">
                <div className="relative bg-[#0C1020] rounded-3xl overflow-hidden select-none aspect-square">
                  <img src={displayImage} alt={nameHe} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setActiveImgTracked(i)}
                        className={`rounded-full transition-all duration-200 ${activeImg === i ? 'w-6 h-2.5 bg-blue-400' : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'}`} />
                    ))}
                  </div>
                </div>
                <div dir="ltr" className="flex gap-2">
                  {gallery.map((src, i) => (
                    <button key={i} onClick={() => setActiveImgTracked(i)}
                      className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all bg-[#0C1020] ${activeImg === i ? 'border-blue-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {trustBadges.slice(0, 3).map(({ icon, text }) => (
                    <div key={text} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-1">{icon}</div>
                      <p className="text-xs text-gray-600 whitespace-pre-line font-medium leading-tight">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inStock ? 'במלאי ✓' : 'אזל המלאי'}</span>
                    {ratingDisplay && <span className="text-xs text-gray-400">⭐ {ratingDisplay} · {reviewCount} ביקורות</span>}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{nameHe}</h1>
                  {subtitle && <p className="text-base text-gray-500 mt-1">{subtitle}</p>}
                </div>

                {benefitsList && benefitsList.length > 0 && (
                  <ul className="space-y-1.5">
                    {benefitsList.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-emerald-500 flex-shrink-0 mt-0.5 font-bold">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {(carouselReviews?.length ?? 0) > 0 && <ReviewCarousel reviews={carouselReviews!} />}

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">בחר חבילה:</p>
                  <BundleSelector />
                </div>

                {isSectionEnabled('urgency') && (
                  <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                    <span>🔥</span>
                    <span><strong>מבצע מוגבל:</strong> {urgencyText}</span>
                  </div>
                )}

                {bundle.compareAtPrice > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{bundle.quantity} {bundle.quantity === 1 ? 'כרטיס' : 'כרטיסים'} · {priceDisplay(pricePerUnit)} ליחידה</span>
                      <span className="font-extrabold text-xl text-gray-900">{priceDisplay(bundle.price)}</span>
                    </div>
                    <p className="text-green-600 font-bold text-xs mt-1">✓ חסכת {priceDisplay(saveAmount)} ({savePercent}% הנחה)</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button onClick={handleBuyNow} className="w-full bg-blue-700 text-white font-extrabold py-4 rounded-xl hover:bg-blue-800 transition-colors text-lg shadow-lg">
                    {buyNowText} {priceDisplay(bundle.price)}
                  </button>
                  <button onClick={handleAdd} className="w-full bg-white text-blue-600 border-2 border-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg">
                    {added ? '✓ נוסף לסל! 🛒' : addToCartLabel}
                  </button>
                </div>

                {isSectionEnabled('shipping') && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border">
                    <span className="text-xl">🚚</span>
                    <div>
                      <p className="font-semibold text-gray-900">משלוח חינם לכל הארץ</p>
                      <p className="text-xs text-gray-500">{shippingText}</p>
                    </div>
                  </div>
                )}
                {isSectionEnabled('guarantee') && (
                  <div className="flex items-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-3 text-sm">
                    <span className="text-2xl flex-shrink-0">🛡️</span>
                    <p><strong>ביטחון בקנייה:</strong> {guaranteeText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BELOW FOLD — rendered in section order ═══ */}

        {belowFoldOrder.map(sType => {

          if (sType === 'benefits' && pageContent.features?.length > 0) return (
            <section key="benefits" className="py-10 px-4 bg-white border-t">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-lg font-extrabold text-center text-gray-900 mb-5">למה <span dir="ltr">FindCard</span>?</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {pageContent.features.map(f => (
                    <div key={f.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <div className="text-3xl mb-1.5">{f.icon}</div>
                      <p className="text-xs font-bold text-gray-800 leading-tight">{f.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-tight">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )

          if (sType === 'video' && videoUrl) return (
            <section key="video" className="py-10 px-4 bg-white border-t">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-lg font-extrabold text-center text-gray-900 mb-5">צפה בסרטון</h2>
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-black">
                  <iframe
                    src={toEmbedUrl(videoUrl)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            </section>
          )

          if (sType === 'before_after' && beforeAfter && beforeAfter.length > 0) return (
            <section key="before_after" className="py-10 px-4 bg-gray-50 border-t">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-lg font-extrabold text-center text-gray-900 mb-6">לפני ואחרי</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {beforeAfter.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-gray-100">
                        <div className="p-3 text-center">
                          <p className="text-xs font-bold text-gray-400 mb-2">לפני</p>
                          <img src={item.before} alt="לפני" className="w-full h-36 object-cover rounded-xl" />
                        </div>
                        <div className="p-3 text-center">
                          <p className="text-xs font-bold text-emerald-600 mb-2">אחרי</p>
                          <img src={item.after} alt="אחרי" className="w-full h-36 object-cover rounded-xl" />
                        </div>
                      </div>
                      {item.label && <p className="text-xs text-center text-gray-500 px-4 pb-3 font-medium">{item.label}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )

          if (sType === 'reviews' && reviews.length > 0) return (
          <section key="reviews" className="py-12 px-4 bg-gray-50 border-t">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">מה הלקוחות אומרים</h2>
                {ratingDisplay && (
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <span className="text-yellow-400 text-2xl tracking-tight">★★★★★</span>
                    <span className="text-3xl font-black text-gray-900">{ratingDisplay}</span>
                    <span className="text-gray-400 text-sm">מתוך 5 · {reviewCount} ביקורות מאומתות</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleReviews.map(({ photo, name, location, text, detail, rating }, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      {photo
                        ? <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                        : <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-700 text-sm">{name.slice(0, 2)}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-sm text-gray-900">{name}</p>
                          <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full font-medium leading-none">✓ מאומת</span>
                        </div>
                        {(location || detail) && <p className="text-xs text-gray-400 mt-0.5">{[location, detail].filter(Boolean).join(' · ')}</p>}
                      </div>
                    </div>
                    <div className="text-yellow-400 text-sm mb-2">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>
                    <p className="text-gray-700 text-sm leading-relaxed">&ldquo;{text}&rdquo;</p>
                  </div>
                ))}
              </div>
              {!showAllReviews && reviews.length > 6 && (
                <div className="text-center mt-6">
                  <button onClick={() => setShowAllReviews(true)}
                    className="bg-white border border-gray-200 text-gray-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
                    הצג עוד {reviews.length - 6} ביקורות ↓
                  </button>
                </div>
              )}
              <div className="text-center mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-1">הצטרף לאלפי לקוחות מרוצים...</p>
                <p className="text-xs text-blue-600">100 יום החזר כסף מלא · אחריות לכל החיים · משלוח חינם</p>
              </div>
            </div>
          </section>
          )

          if (sType === 'faq' && pageContent.faqs?.length > 0) return (
            <section key="faq" className="py-10 px-4 bg-white border-t">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-lg font-extrabold text-center text-gray-900 mb-5">שאלות נפוצות</h2>
                <div className="space-y-2">
                  {pageContent.faqs.map(({ q, a }, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                      <button onClick={() => {
                        const isOpening = openFaq !== i
                        setOpenFaq(openFaq === i ? null : i)
                        if (isOpening) track('faq_open', { faqIndex: i, question: q.slice(0, 80), product: slug })
                      }}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-right font-semibold text-gray-900 text-sm hover:bg-gray-100 transition-colors">
                        <span>{q}</span>
                        <span className={`text-gray-400 text-xl transition-transform duration-200 flex-shrink-0 mr-3 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      {openFaq === i && <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{a}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )

          return null
        })}
      </main>
      <Footer />
    </div>
  )
}
