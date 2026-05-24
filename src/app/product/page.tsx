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
  descriptionHe: 'כרטיס מעקב חכם תואם Apple Find My. דק בדיוק 1.8 מ"מ — נכנס לכל ארנק ומוצא את המפתחות, הארנק וכל דבר אחר תוך שניות.',
  compat: 'iPhone ו-iPad בלבד (iOS 14.5 ומעלה)',
  features: [
    'עובי 1.8 מ"מ — נכנס לכל ארנק, לא מרגישים אותו',
    'עובד עם Apple Find My — בלי תשלום חודשי',
    'סוללה אלחוטית Qi — שמונה חודשים בין טעינה לטעינה',
    'מצפצף חזק כשלוחצים בטלפון — מוצאים תוך שניות',
    'עמיד לגמרי במים IP67 — שוקע מטר, לא קורה כלום',
    'הגדרה ב-30 שניות — בלי הורדות, בלי הרשמה',
  ],
}

const TIERS = [
  { actualCards: 1, label: 'כרטיס 1', sublabel: '', price: 19990, compareAt: 29900, badge: null as string | null, badgeOrange: false },
  { actualCards: 3, label: '2 כרטיסים + 1 חינם', sublabel: '(סה"כ 3 כרטיסים)', price: 29990, compareAt: 59900, badge: '72% מהלקוחות בחרו', badgeOrange: false },
  { actualCards: 4, label: '3 כרטיסים + 1 חינם', sublabel: '(סה"כ 4 כרטיסים)', price: 37990, compareAt: 79900, badge: 'הכי משתלם!', badgeOrange: true },
]

const SPECS = [
  ['גודל', '85.6 × 54 × 1.8 מ"מ'],
  ['משקל', '7 גרם'],
  ['סוללה', 'Li-Polymer — נטענת אלחוטית (Qi)'],
  ['זמן טעינה', 'כ-2 שעות'],
  ['חיי סוללה', 'עד 8 חודשים'],
  ['עמידות', 'IP67 (מים ואבק)'],
  ['טכנולוגיה', 'Bluetooth 5.1 + Apple Find My'],
  ['טווח', 'עד 90 מטר (Bluetooth ישיר)'],
  ['אחריות', 'אחריות לכל החיים + 100 יום החזר כסף'],
]

const FEATURE_SLIDES = [
  {
    icon: '📡', color: 'from-blue-600 to-indigo-700', label: 'Apple Find My',
    title: 'Apple Find My — רשת עולמית',
    desc: 'FindCard רץ על רשת ה-Find My של Apple — מאות מיליוני אייפונים שעובדים ביחד. כל אחד שעובר ליד הכרטיס מעדכן את המיקום שלו בשקט. פותחים Find My ורואים בדיוק איפה.',
    stat: 'מעל 500 מיליון מכשיר Apple ברשת', statIcon: '🌐',
  },
  {
    icon: '🔋', color: 'from-emerald-600 to-teal-700', label: '8 חודשי סוללה',
    title: '8 חודשי סוללה — לא תחשוב עליה',
    desc: 'מניחים על משטח Qi פעם בשמונה חודשים ושעתיים אחרי — מלא. לא מחליפים סוללה לעולם, לא קונים CR2032, לא שום דבר.',
    stat: 'עד 8 חודשים בין טעינה לטעינה', statIcon: '⚡',
  },
  {
    icon: '💳', color: 'from-violet-600 to-purple-700', label: '1.8 מ"מ — דק',
    title: 'הכי דק בשוק — 1.8 מ"מ בלבד',
    desc: '1.8 מ"מ ו-7 גרם. לא תרגיש אותו בארנק, לא בתיק, לא בכיס. הוא פשוט שם — ואתה פותח את הטלפון כשצריך למצוא.',
    stat: 'עובי 1.8 מ"מ בלבד — נכנס לכל ארנק', statIcon: '✦',
  },
  {
    icon: '🌊', color: 'from-cyan-600 to-blue-700', label: 'עמידות IP67',
    title: 'IP67 — עמיד בגשם, שלג ולחות',
    desc: 'הכרטיס מוגן IP67 — שוקע מטר עומק ל-30 דקות ולא קורה לו כלום. נפל לשירותים? נכנס לכביסה בטעות? יצא ממנה עובד.',
    stat: 'IP67 — עד מטר עומק, 30 דקות', statIcon: '🛡️',
  },
  {
    icon: '🔊', color: 'from-orange-500 to-red-600', label: 'התראה קולית',
    title: 'התראה קולית חזקה',
    desc: 'לוחצים באפליקציה — הכרטיס מצפצף חזק. אפשר למצוא אותו מתחת לכרית, בין הכיסאות, בתוך התיק. כמה שניות וזהו.',
    stat: 'נשמע ממרחק עד 30 מטר', statIcon: '📢',
  },
  {
    icon: '⚡', color: 'from-blue-500 to-indigo-600', label: 'הגדרה מהירה',
    title: 'הגדרה תוך 30 שניות',
    desc: 'פותחים Find My, "הוסף מכשיר", מכניסים לארנק. זהו. בלי הורדות, בלי הרשמה, בלי סיסמאות. 30 שניות ואתה בסדר.',
    stat: '30 שניות הגדרה ראשונית', statIcon: '🎯',
  },
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

const CAROUSEL_REVIEWS = REVIEWS.slice(0, 3)

const FAQS = [
  { q: 'איך FindCard עובד?', a: 'FindCard משתמש בטכנולוגיית Bluetooth 5.1 ומתחבר לרשת ה-Find My של Apple. כל מכשיר iPhone בסביבה מדווח על מיקום הכרטיס לשרתי Apple — ואתה מקבל את המיקום המדויק דרך האפליקציה.' },
  { q: 'האם זה עובד עם אנדרואיד?', a: 'כרגע רק עם Apple — iPhone ו-iPad עם iOS 14.5 ומעלה.' },
  { q: 'כמה עבה הכרטיס?', a: 'בדיוק 1.8 מ"מ — אותו עובי של כרטיס אשראי. נכנס לכל תא כרטיסים, בכל ארנק, מבלי ליצור בליטה.' },
  { q: 'כמה זמן הסוללה מחזיקה?', a: 'עד 8 חודשים בשימוש יומיומי. טעינה אלחוטית (Qi) — מניחים על משטח טעינה ותוך שעתיים הסוללה מלאה. לא צריך להחליף סוללה לעולם.' },
  { q: 'מה הטווח המקסימלי?', a: 'טווח Bluetooth ישיר של עד 90 מטר. מחוץ לטווח — רשת Find My ממשיכה לעדכן את המיקום דרך כל iPhone בסביבה, בכל מקום בעולם.' },
  { q: 'האם הכרטיס עמיד במים?', a: 'כן! FindCard מדורג IP67 — עמיד בשקיעה במים עד עומק 1 מטר למשך 30 דקות. עמיד גם בגשם, שלג ולחות.' },
  { q: 'כמה זמן ההגדרה הראשונית?', a: 'כ-30 שניות. פותחים Find My באייפון, לוחצים "הוסף מכשיר" ומוכנים. בלי להוריד שום דבר נוסף.' },
  { q: 'מה כוללת האחריות?', a: 'אחריות לכל החיים על פגמי ייצור + 100 יום החזר כסף מלא אם לא מרוצה מכל סיבה. בלי שאלות.' },
]

const GALLERY = [
  { src: '/images/product-1-hero.svg', label: 'תמונה ראשית' },
  { src: '/images/product-2-wallet.svg', label: 'בארנק' },
  { src: '/images/product-3-bundle.svg', label: 'חבילה' },
  { src: '/images/product-4-features.svg', label: 'פיצ\'רים' },
]

function MiniReviewCarousel() {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  function prev() { setIdx(i => (i - 1 + CAROUSEL_REVIEWS.length) % CAROUSEL_REVIEWS.length) }
  function next() { setIdx(i => (i + 1) % CAROUSEL_REVIEWS.length) }

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
  }

  const r = CAROUSEL_REVIEWS[idx]

  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center gap-3 mb-3">
        <img src={r.photo} alt={r.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-white shadow" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900">{r.name} <span className="text-gray-400 font-normal">· {r.location}</span></p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < r.stars ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
            ))}
            <span className="text-xs text-green-600 font-medium mr-1">מאומת ✓</span>
          </div>
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">"{r.text}"</p>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">{r.detail}</p>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs">›</button>
          <div className="flex gap-1.5">
            {CAROUSEL_REVIEWS.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`rounded-full transition-all duration-300 ${i === idx ? 'w-5 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-300'}`} />
            ))}
          </div>
          <button onClick={next} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-xs">‹</button>
        </div>
      </div>
    </div>
  )
}

function FeatureCarousel() {
  const [active, setActive] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setActive(a => (a + 1) % FEATURE_SLIDES.length), 4500)
  }

  useEffect(() => { resetTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [])

  function go(i: number) { setActive(i); resetTimer() }

  const f = FEATURE_SLIDES[active]

  return (
    <section className="py-14 px-4 bg-white overflow-hidden border-t">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-8">
          למה FindCard הוא הבחירה הנכונה?
        </h2>
        <div className={`bg-gradient-to-br ${f.color} rounded-3xl p-8 md:p-10 text-white mb-6 transition-all duration-500`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-7xl md:text-8xl flex-shrink-0">{f.icon}</div>
            <div className="text-center md:text-right flex-1">
              <h3 className="text-xl md:text-2xl font-extrabold mb-3">{f.title}</h3>
              <p className="text-white/80 text-base leading-relaxed mb-4">{f.desc}</p>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-bold">
                <span>{f.statIcon}</span>
                <span>{f.stat}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {FEATURE_SLIDES.map((_, i) => (
              <button key={i} onClick={() => go(i)} className={`rounded-full transition-all duration-300 ${active === i ? 'w-7 h-3 bg-blue-600' : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 w-full">
            {FEATURE_SLIDES.map((slide, i) => (
              <button key={i} onClick={() => go(i)} className={`rounded-xl p-3 text-center transition-all border-2 ${active === i ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                <div className="text-2xl mb-1">{slide.icon}</div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{slide.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ProductPage() {
  const [tierIndex, setTierIndex] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const addItem = useCartStore(s => s.addItem)
  const router = useRouter()

  const tier = TIERS[tierIndex]
  const saveAmount = tier.compareAt - tier.price
  const savePercent = Math.round((saveAmount / tier.compareAt) * 100)
  const pricePerUnit = Math.round(tier.price / tier.actualCards)

  function handleAdd() {
    addItem({ productId: PRODUCT.id, slug: PRODUCT.slug, nameHe: `${PRODUCT.nameHe} — ${tier.label}`, image: '', sellingPrice: tier.price, quantity: 1, variantLabel: tier.label })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    addItem({ productId: PRODUCT.id, slug: PRODUCT.slug, nameHe: `${PRODUCT.nameHe} — ${tier.label}`, image: '', sellingPrice: tier.price, quantity: 1, variantLabel: tier.label })
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Sticky mobile buy bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{tier.label}</p>
            <p className="text-xl font-black text-blue-700 leading-tight">{priceDisplay(tier.price)}</p>
          </div>
          <button onClick={handleBuyNow} className="bg-blue-700 text-white font-extrabold px-5 py-3 rounded-xl text-base shadow-lg flex-shrink-0">
            קנה עכשיו ←
          </button>
          <button onClick={handleAdd} className="bg-white border-2 border-blue-600 text-blue-600 font-bold px-4 py-3 rounded-xl text-base flex-shrink-0">
            {added ? '✓' : '🛒'}
          </button>
        </div>
      </div>

      <main className="flex-1 pb-24 lg:pb-0">

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">בית</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">FindCard PRO</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left: Image gallery + mini review carousel */}
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl overflow-hidden">
                <img src={GALLERY[activeImg].src} alt={GALLERY[activeImg].label} className="w-full h-auto" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {GALLERY.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-blue-600 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}>
                    <img src={img.src} alt={img.label} className="w-full h-auto" />
                  </button>
                ))}
              </div>

              {/* Mini review carousel */}
              <MiniReviewCarousel />

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '🛡️', text: 'אחריות\nלכל החיים' },
                  { icon: '🚚', text: 'משלוח חינם\nעל כל הזמנה' },
                  { icon: '🔒', text: 'תשלום\nמאובטח' },
                ].map(({ icon, text }) => (
                  <div key={text} className="bg-gray-50 rounded-xl p-3 border">
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-xs text-gray-600 whitespace-pre-line font-medium">{text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-center font-medium text-blue-700">
                🍎 תואם: {PRODUCT.compat}
              </div>
            </div>

            {/* Right: Product info */}
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">במלאי ✓</span>
                  <span className="text-xs text-gray-400">⭐ 4.9 · 312 ביקורות</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{PRODUCT.nameHe}</h1>
                <p className="text-gray-500 leading-relaxed text-sm">{PRODUCT.descriptionHe}</p>
              </div>

              {/* Feature bullets */}
              <div className="bg-blue-50 rounded-xl p-4">
                <ul className="space-y-2">
                  {PRODUCT.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="text-blue-500 font-bold flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Urgency */}
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                <span>🔥</span>
                <span><strong>מבצע מוגבל:</strong> 24 שעות אחרונות למחיר הזה!</span>
              </div>

              {/* Tier selector */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">בחר חבילה:</p>
                <div className="space-y-3">
                  {TIERS.map((t, i) => {
                    const isSelected = tierIndex === i
                    const tierSavePct = Math.round(((t.compareAt - t.price) / t.compareAt) * 100)
                    return (
                      <button key={i} onClick={() => setTierIndex(i)} className={`w-full text-right border-2 rounded-xl px-4 py-3.5 transition-all relative ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        {t.badge && (
                          <span className={`absolute -top-2.5 right-3 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ${t.badgeOrange ? 'bg-orange-500' : 'bg-blue-600'}`}>
                            {t.badge}
                          </span>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">{t.label}</p>
                              {t.sublabel && <p className="text-xs text-gray-400">{t.sublabel}</p>}
                            </div>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <p className={`text-lg font-black ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>{priceDisplay(t.price)}</p>
                            <p className="text-xs text-gray-400 line-through">{priceDisplay(t.compareAt)}</p>
                            <p className="text-xs font-bold text-green-600">חסוך {tierSavePct}%</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{tier.actualCards} כרטיסים · {priceDisplay(pricePerUnit)} ליחידה</span>
                  <span className="font-extrabold text-xl text-gray-900">{priceDisplay(tier.price)}</span>
                </div>
                <p className="text-green-600 font-bold text-xs mt-1">✓ חסכת {priceDisplay(saveAmount)} ({savePercent}% הנחה)</p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <button onClick={handleBuyNow} className="w-full bg-blue-700 text-white font-extrabold py-4 rounded-xl hover:bg-blue-800 transition-colors text-lg shadow-lg">
                  קנה עכשיו ← {priceDisplay(tier.price)}
                </button>
                <button onClick={handleAdd} className="w-full bg-white text-blue-600 border-2 border-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg">
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

              {/* Guarantee strip */}
              <div className="flex items-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-3 text-sm">
                <span className="text-2xl flex-shrink-0">🛡️</span>
                <p><strong>אחריות לכל החיים</strong> + 100 יום החזר כסף מלא — בלי שאלות</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature carousel */}
        <FeatureCarousel />

        {/* Specs table */}
        <section className="bg-gray-50 py-14 px-4 border-t">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">מפרט טכני</h2>
            <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {SPECS.map(([k, v]) => (
                    <tr key={k} className="hover:bg-gray-50">
                      <td className="px-6 py-3.5 font-semibold text-gray-700 w-1/3">{k}</td>
                      <td className="px-6 py-3.5 text-gray-600">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-14 px-4 bg-white border-t">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-2">מה הלקוחות שלנו אומרים</h2>
            <p className="text-center text-gray-500 mb-10">⭐ 4.9 / 5 · מעל 312 ביקורות מאומתות</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {REVIEWS.map(({ photo, name, location, text, detail, stars }) => (
                <div key={name + location} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={photo} alt={name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{name}</p>
                      <p className="text-xs text-gray-400">{location}</p>
                    </div>
                    <span className="mr-auto text-xs bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">מאומת ✓</span>
                  </div>
                  <div className="flex mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-lg ${i < stars ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed flex-1">"{text}"</p>
                  <p className="text-xs text-gray-400 mt-4 pt-3 border-t">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gray-50 py-14 px-4 border-t">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-10">שאלות נפוצות</h2>
            <div className="space-y-3">
              {FAQS.map(({ q, a }, i) => (
                <div key={i} className="bg-white border rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-right font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    <span>{q}</span>
                    <span className={`text-gray-400 text-xl transition-transform duration-200 flex-shrink-0 mr-3 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t pt-3">{a}</div>
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
