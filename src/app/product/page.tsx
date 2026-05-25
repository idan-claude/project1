'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { useRouter } from 'next/navigation'

function priceDisplay(agorot: number): string {
  const n = agorot / 100
  return `₪${Number.isInteger(n) ? n.toLocaleString('he-IL') : n.toFixed(2)}`
}

const PRODUCT = {
  id: 'kartis-maakav-smart-pro',
  slug: 'kartis-maakav-smart-pro',
  nameHe: 'כרטיס מעקב FindCard PRO',
}

const TIERS = [
  { actualCards: 1, label: 'כרטיס 1', sublabel: '', price: 19990, compareAt: 29890, badge: null as string | null, badgeColor: '' },
  { actualCards: 3, label: '2 כרטיסים + 1 חינם', sublabel: 'סה"כ 3 כרטיסים', price: 29990, compareAt: 59890, badge: '72% מהלקוחות', badgeColor: 'bg-blue-600' },
  { actualCards: 4, label: '3 כרטיסים + 1 חינם', sublabel: 'סה"כ 4 כרטיסים', price: 37990, compareAt: 79890, badge: 'הכי משתלם!', badgeColor: 'bg-orange-500' },
]

const FEATURES = [
  { icon: '📡', label: 'Apple Find My', desc: '500 מיליון+ מכשיר ברשת' },
  { icon: '💳', label: 'עובי 1.8 מ"מ', desc: 'נכנס לכל ארנק' },
  { icon: '🔋', label: '8 חודשי סוללה', desc: 'טעינה אלחוטית Qi' },
  { icon: '🌊', label: 'IP67 עמיד מים', desc: 'גשם, שלג, לחות' },
  { icon: '🔊', label: 'התראה קולית', desc: 'עד 30 מטר' },
  { icon: '⚡', label: 'הגדרה 30 שניות', desc: 'בלי הורדות' },
]

const REVIEWS = [
  {
    photo: 'https://i.pravatar.cc/80?img=9', name: 'דנה כ.', location: 'תל אביב',
    stars: 5, detail: 'לקוחה 4 חודשים',
    text: 'שנתיים הייתי מאבדת את הארנק שלי בבית — לפחות פעמיים בשבוע. מאז שהכנסתי את FindCard לא חיפשתי אותו ולו פעם אחת. פשוט פותחת Find My ותוך 10 שניות מוצאת. שינה לי את החיים!',
  },
  {
    photo: 'https://i.pravatar.cc/80?img=33', name: 'אבי מ.', location: 'חיפה',
    stars: 5, detail: 'קנה 3 יחידות · לקוח 6 חודשים',
    text: 'קניתי שלושה — לי, לאשתי ולבן ה-14 שמאבד כל דבר. הבן שלי "איבד" את הילקוט בבית הספר ומצאנו אותו תוך דקה! ממליץ בחום.',
  },
  {
    photo: 'https://i.pravatar.cc/80?img=26', name: 'שירה ל.', location: 'ירושלים',
    stars: 5, detail: 'לקוחה 5 חודשים',
    text: 'טסתי לאמסטרדם ואיבדתי את המזוודה בפרנקפורט. ידעתי בדיוק שהיא בשדה התעופה הגרמני! הראיתי לשירות לקוחות את המפה ושלחו אותה אלי. הציל לי את החופשה ממש.',
  },
  {
    photo: 'https://i.pravatar.cc/80?img=44', name: 'מרים ה.', location: 'נתניה',
    stars: 5, detail: 'קנתה לאמא · לקוחה 5 חודשים',
    text: 'קניתי לאמא שלי בת ה-78 שמאבדת את הארנק כל יום. פשוט מתקשרים אליה ומוצאים דרך הטלפון שלנו. שלום נפשי לכל המשפחה!',
  },
  {
    photo: 'https://i.pravatar.cc/80?img=63', name: 'נועה ג.', location: 'הרצליה',
    stars: 4, detail: 'לקוחה 3 חודשים',
    text: 'קיבלתי במתנה ולא הייתי בטוחה שאשתמש. חודש אחרי — הארנק נפל מהתיק בקניון, Find My הראה שהוא עדיין שם. חזרתי ומצאתי. חסכתי כ-750 שקל!',
  },
  {
    photo: 'https://i.pravatar.cc/80?img=17', name: 'תומר ז.', location: 'גבעתיים',
    stars: 3, detail: 'לקוח חודשיים',
    text: 'עובד כמו שאמרו. ההגדרה הייתה קצת מבלבלת בהתחלה אבל אחרי 5 דקות הסתדרתי. המשלוח לקח כשבועיים. בסך הכל מרוצה.',
  },
]

const FAQS = [
  { q: 'איך FindCard עובד?', a: 'FindCard משתמש ב-Bluetooth 5.1 ומתחבר לרשת ה-Find My של Apple. כל iPhone בסביבה מדווח על מיקום הכרטיס לשרתי Apple — ואתה מקבל את המיקום המדויק דרך האפליקציה.' },
  { q: 'האם זה עובד עם אנדרואיד?', a: 'כרגע רק עם Apple — iPhone ו-iPad עם iOS 14.5 ומעלה. גרסת אנדרואיד בדרך.' },
  { q: 'כמה עבה הכרטיס?', a: 'בדיוק 1.8 מ"מ — אותו עובי של כרטיס אשראי. נכנס לכל תא כרטיסים, בכל ארנק.' },
  { q: 'כמה זמן הסוללה מחזיקה?', a: 'עד 8 חודשים בשימוש יומיומי. טעינה אלחוטית Qi — מניחים על משטח ותוך שעתיים מלא.' },
  { q: 'האם הכרטיס עמיד במים?', a: 'כן! IP67 — עמיד בשקיעה עד 1 מטר למשך 30 דקות. עמיד גם בגשם, שלג ולחות.' },
  { q: 'מה כוללת האחריות?', a: 'אחריות לכל החיים על פגמי ייצור + 100 יום החזר כסף מלא אם לא מרוצה מכל סיבה. בלי שאלות.' },
]

const GALLERY = [
  '/images/product-1-hero.svg',
  '/images/product-2-wallet.svg',
  '/images/product-3-bundle.svg',
  '/images/product-4-features.svg',
]

function ReviewCarousel() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % 3), 4500)
    return () => clearInterval(t)
  }, [])
  const r = REVIEWS[idx]
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <img src={r.photo} alt={r.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white shadow-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-yellow-400 text-xs">★★★★★</span>
            <span className="text-xs text-gray-600 font-semibold">{r.name}</span>
            <span className="text-xs text-green-600 font-medium">מאומת ✓</span>
          </div>
          <p className="text-xs text-gray-700 leading-snug line-clamp-2">"{r.text}"</p>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {[0, 1, 2].map(i => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all duration-200 ${idx === i ? 'w-4 h-1.5 bg-amber-500' : 'w-1.5 h-1.5 bg-amber-300/70'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function ProductPage() {
  const [tierIndex, setTierIndex] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const imgTouchStart = useRef(0)
  const addItem = useCartStore(s => s.addItem)
  const router = useRouter()

  const tier = TIERS[tierIndex]
  const saveAmount = tier.compareAt - tier.price
  const savePercent = Math.round((saveAmount / tier.compareAt) * 100)
  const pricePerUnit = Math.round(tier.price / tier.actualCards)

  function addCartItem() {
    addItem({ productId: PRODUCT.id, slug: PRODUCT.slug, nameHe: `${PRODUCT.nameHe} — ${tier.label}`, image: '', sellingPrice: tier.price, quantity: 1, variantLabel: tier.label })
  }

  function handleAdd() { addCartItem(); setAdded(true); setTimeout(() => setAdded(false), 2000) }
  function handleBuyNow() { addCartItem(); router.push('/checkout') }

  function imgSwipe(e: React.TouchEvent, type: 'start' | 'end') {
    if (type === 'start') { imgTouchStart.current = e.touches[0].clientX; return }
    const diff = imgTouchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) setActiveImg(i => diff > 0 ? (i + 1) % GALLERY.length : (i - 1 + GALLERY.length) % GALLERY.length)
  }

  // Shared tier selector used in both mobile and desktop layouts
  function TierSelector() {
    return (
      <div className="space-y-2.5">
        {TIERS.map((t, i) => {
          const sel = tierIndex === i
          const pct = Math.round(((t.compareAt - t.price) / t.compareAt) * 100)
          return (
            <button
              key={i}
              onClick={() => setTierIndex(i)}
              className={`w-full text-right rounded-2xl px-4 py-3 transition-all relative border-2 ${sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              {t.badge && (
                <span className={`absolute -top-2.5 right-3 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ${t.badgeColor}`}>
                  {t.badge}
                </span>
              )}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-blue-600' : 'border-gray-300'}`}>
                    {sel && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{t.label}</p>
                    {t.sublabel && <p className="text-xs text-gray-400">{t.sublabel}</p>}
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-lg font-black leading-none ${sel ? 'text-blue-600' : 'text-gray-900'}`}>{priceDisplay(t.price)}</p>
                  <p className="text-xs text-gray-400 line-through">{priceDisplay(t.compareAt)}</p>
                  <p className="text-xs font-bold text-green-600">-{pct}%</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }


  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Sticky buy bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">{tier.label}</p>
            <p className="text-lg font-black text-blue-700 leading-tight">{priceDisplay(tier.price)}</p>
          </div>
          <button onClick={handleBuyNow} className="bg-blue-700 text-white font-extrabold px-5 py-3 rounded-xl text-sm shadow-lg flex-shrink-0">
            קנה עכשיו ←
          </button>
          <button onClick={handleAdd} className="bg-white border-2 border-blue-600 text-blue-600 font-bold px-4 py-3 rounded-xl text-sm flex-shrink-0">
            {added ? '✓' : '🛒'}
          </button>
        </div>
      </div>

      <main className="flex-1 pb-24 lg:pb-0">

        {/* ═══ MOBILE LAYOUT ═══ */}
        <div className="lg:hidden">

          {/* Image with dot nav */}
          <div
            className="relative bg-gray-50 select-none"
            onTouchStart={e => imgSwipe(e, 'start')}
            onTouchEnd={e => imgSwipe(e, 'end')}
          >
            <img
              src={GALLERY[activeImg]}
              alt="FindCard PRO"
              className="w-full"
              style={{ aspectRatio: '800/500', objectFit: 'contain' }}
            />
            {/* Dot nav overlaid at bottom of image */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {GALLERY.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`rounded-full transition-all duration-200 ${activeImg === i ? 'w-5 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-400/60'}`}
                />
              ))}
            </div>
          </div>

          <div className="px-4 pt-3 space-y-3">

            {/* Stars + title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 text-sm font-bold">★★★★★</span>
                <span className="text-xs text-gray-500">4.9 · 312 ביקורות</span>
                <span className="mr-auto text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">במלאי ✓</span>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900 leading-snug">כרטיס מעקב FindCard PRO</h1>
            </div>

            {/* Review strip */}
            <ReviewCarousel />

            {/* Tier selector */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">בחר חבילה:</p>
              <TierSelector />
            </div>

            {/* Urgency — below bundles */}
            <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
              <span>🔥</span>
              <span><strong>מבצע מוגבל:</strong> 24 שעות אחרונות למחיר הזה!</span>
            </div>

            {/* Price + buy buttons */}
            <div>
              <div className="flex items-baseline gap-2 mb-2.5">
                <span className="text-3xl font-black text-blue-700">{priceDisplay(tier.price)}</span>
                <span className="text-gray-400 line-through text-base">{priceDisplay(tier.compareAt)}</span>
                <span className="text-sm font-bold text-green-600">חסכת {priceDisplay(saveAmount)}</span>
              </div>
              <button
                onClick={handleBuyNow}
                className="w-full bg-blue-700 text-white font-extrabold py-4 rounded-2xl text-lg shadow-lg mb-2 hover:bg-blue-800 transition-colors"
              >
                קנה עכשיו ← {priceDisplay(tier.price)}
              </button>
              <button
                onClick={handleAdd}
                className="w-full bg-white text-blue-600 border-2 border-blue-600 font-bold py-3 rounded-2xl text-base hover:bg-blue-50 transition-colors"
              >
                {added ? '✓ נוסף לסל! 🛒' : '🛒 הוסף לסל'}
              </button>
            </div>

            {/* Trust strip */}
            <div className="flex justify-around text-xs text-gray-500 py-1 border-t border-gray-100">
              <span>🛡️ אחריות לכל החיים</span>
              <span>🚚 משלוח חינם</span>
              <span>🔒 תשלום מאובטח</span>
            </div>
          </div>
        </div>

        {/* ═══ DESKTOP LAYOUT ═══ */}
        <div className="hidden lg:block">
          <div className="bg-gray-50 border-b">
            <div className="max-w-6xl mx-auto px-8 py-3 text-sm text-gray-500">
              <Link href="/" className="hover:text-blue-600">בית</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">FindCard PRO</span>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-8 py-10">
            <div className="grid grid-cols-2 gap-12 items-start">

              {/* Left: image sticky */}
              <div className="sticky top-24 space-y-4">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl overflow-hidden select-none">
                  <img src={GALLERY[activeImg]} alt="FindCard PRO" className="w-full" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {GALLERY.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`rounded-full transition-all duration-200 ${activeImg === i ? 'w-6 h-2.5 bg-blue-600' : 'w-2.5 h-2.5 bg-gray-400/50 hover:bg-gray-600/60'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: '🛡️', text: 'אחריות\nלכל החיים' },
                    { icon: '🚚', text: 'משלוח חינם\nלכל הארץ' },
                    { icon: '🔒', text: 'תשלום\nמאובטח SSL' },
                  ].map(({ icon, text }) => (
                    <div key={text} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                      <div className="text-2xl mb-1">{icon}</div>
                      <p className="text-xs text-gray-600 whitespace-pre-line font-medium leading-tight">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: product info */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">במלאי ✓</span>
                    <span className="text-xs text-gray-400">⭐ 4.9 · 312 ביקורות</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">כרטיס מעקב FindCard PRO</h1>
                  <p className="text-gray-500 leading-relaxed text-sm">כרטיס מעקב חכם תואם Apple Find My. דק בדיוק 1.8 מ"מ — נכנס לכל ארנק ומוצא את המפתחות, הארנק וכל דבר אחר תוך שניות.</p>
                </div>

                {/* Review strip desktop */}
                <ReviewCarousel />

                {/* Tier selector */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">בחר חבילה:</p>
                  <TierSelector />
                </div>

                {/* Urgency — below bundles */}
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                  <span>🔥</span>
                  <span><strong>מבצע מוגבל:</strong> 24 שעות אחרונות למחיר הזה!</span>
                </div>

                {/* Price summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{tier.actualCards} כרטיסים · {priceDisplay(pricePerUnit)} ליחידה</span>
                    <span className="font-extrabold text-xl text-gray-900">{priceDisplay(tier.price)}</span>
                  </div>
                  <p className="text-green-600 font-bold text-xs mt-1">✓ חסכת {priceDisplay(saveAmount)} ({savePercent}% הנחה)</p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleBuyNow}
                    className="w-full bg-blue-700 text-white font-extrabold py-4 rounded-xl hover:bg-blue-800 transition-colors text-lg shadow-lg"
                  >
                    קנה עכשיו ← {priceDisplay(tier.price)}
                  </button>
                  <button
                    onClick={handleAdd}
                    className="w-full bg-white text-blue-600 border-2 border-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg"
                  >
                    {added ? '✓ נוסף לסל! 🛒' : 'הוסף לסל 🛒'}
                  </button>
                </div>

                {/* Delivery */}
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border">
                  <span className="text-xl">🚚</span>
                  <div>
                    <p className="font-semibold text-gray-900">משלוח חינם לכל הארץ</p>
                    <p className="text-xs text-gray-500">מגיע תוך 7–14 ימי עסקים · מספר מעקב במייל</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-3 text-sm">
                  <span className="text-2xl flex-shrink-0">🛡️</span>
                  <p><strong>אחריות לכל החיים</strong> + 100 יום החזר כסף מלא — בלי שאלות</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BELOW FOLD — shared ═══ */}

        {/* Feature icons strip */}
        <section className="py-10 px-4 bg-white border-t">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-extrabold text-center text-gray-900 mb-5">למה FindCard?</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {FEATURES.map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className="text-3xl mb-1.5">{f.icon}</div>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{f.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-10 px-4 bg-gray-50 border-t">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-extrabold text-center text-gray-900 mb-1">מה הלקוחות אומרים</h2>
            <p className="text-center text-gray-400 text-xs mb-5">⭐ 4.9 / 5 · מעל 312 ביקורות מאומתות</p>

            {/* Horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
              {REVIEWS.slice(0, 3).map(({ photo, name, location, text, detail, stars }) => (
                <div
                  key={name + location}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex-shrink-0 w-72 md:w-auto"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate">{name} · {location}</p>
                      <span className="text-yellow-400 text-xs">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                    </div>
                    <span className="mr-auto text-xs text-green-600 font-medium flex-shrink-0">מאומת ✓</span>
                  </div>
                  <p className="text-gray-700 text-xs leading-relaxed line-clamp-4">"{text}"</p>
                  <p className="text-xs text-gray-400 mt-2">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 px-4 bg-white border-t">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-extrabold text-center text-gray-900 mb-5">שאלות נפוצות</h2>
            <div className="space-y-2">
              {FAQS.map(({ q, a }, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-right font-semibold text-gray-900 text-sm hover:bg-gray-100 transition-colors"
                  >
                    <span>{q}</span>
                    <span className={`text-gray-400 text-xl transition-transform duration-200 flex-shrink-0 mr-3 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
