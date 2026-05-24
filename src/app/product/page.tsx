'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import { useRouter } from 'next/navigation'

type Platform = 'apple' | 'android'

const APPLE_SLUG = 'kartis-maakav-smart-pro'
const ANDROID_SLUG = 'kartis-maakav-android-pro'

const PRODUCTS = {
  apple: {
    id: APPLE_SLUG,
    slug: APPLE_SLUG,
    nameHe: 'כרטיס מעקב FindCard PRO',
    descriptionHe: 'כרטיס מעקב חכם תואם Apple Find My. דק בדיוק 1.8מ"מ — נכנס לכל ארנק ומוצא את המפתחות, הארנק וכל דבר אחר תוך שניות.',
    sellingPrice: 16900,
    compareAtPrice: 24900,
    compatLabel: 'Apple Find My',
    compatIcon: '🍎',
    features: [
      'דק 1.8מ"מ — נכנס לכל ארנק בנוחות',
      'תואם Apple Find My — ללא מנוי חודשי',
      'סוללה נטענת אלחוטית עד 6 חודשים',
      'התראה קולית חזקה בלחיצת כפתור',
      'עמיד בפני מים IP67 (עד 1 מטר)',
      'הגדרה ראשונית תוך 30 שניות',
    ],
    compat: 'iPhone ו-iPad בלבד (iOS 14.5+)',
  },
  android: {
    id: ANDROID_SLUG,
    slug: ANDROID_SLUG,
    nameHe: 'כרטיס מעקב FindCard Android',
    descriptionHe: 'כרטיס מעקב חכם תואם Google Find My Device. עובד עם כל מכשיר Android — מצא את הארנק, המפתחות וכל דבר אחר בשניות.',
    sellingPrice: 14900,
    compareAtPrice: 22900,
    compatLabel: 'Google Find My Device',
    compatIcon: '🤖',
    features: [
      'דק 1.8מ"מ — נכנס לכל ארנק בנוחות',
      'תואם Google Find My Device — ללא מנוי',
      'סוללה נטענת אלחוטית עד 6 חודשים',
      'התראה קולית חזקה בלחיצת כפתור',
      'עמיד בפני מים IP67 (עד 1 מטר)',
      'הגדרה ראשונית תוך 30 שניות',
    ],
    compat: 'Android 6.0+ עם Google Play Services',
  },
}

function AppleCardSVG() {
  return (
    <svg viewBox="0 0 360 225" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto rounded-2xl" style={{ filter: 'drop-shadow(0 20px 40px rgba(30,58,138,0.4))' }}>
      <defs>
        <linearGradient id="apg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a"/>
          <stop offset="100%" stopColor="#4338ca"/>
        </linearGradient>
        <linearGradient id="chg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
        <radialGradient id="glow" cx="75%" cy="25%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="360" height="225" rx="20" fill="url(#apg)"/>
      <rect width="360" height="225" rx="20" fill="url(#glow)"/>
      {/* Decorative arcs */}
      <circle cx="310" cy="-20" r="110" fill="none" stroke="white" strokeWidth="1" opacity="0.08"/>
      <circle cx="310" cy="-20" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
      <circle cx="50" cy="260" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
      {/* Chip */}
      <rect x="28" y="68" width="52" height="40" rx="7" fill="url(#chg)"/>
      <rect x="28" y="68" width="52" height="40" rx="7" fill="none" stroke="#d97706" strokeWidth="0.5" opacity="0.5"/>
      <line x1="41" y1="68" x2="41" y2="108" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="54" y1="68" x2="54" y2="108" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="67" y1="68" x2="67" y2="108" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="83" x2="80" y2="83" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="96" x2="80" y2="96" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      {/* Brand name */}
      <text x="28" y="50" fill="#93c5fd" fontSize="10.5" fontWeight="700" letterSpacing="3.5" fontFamily="'Arial', sans-serif">FINDCARD</text>
      {/* PRO badge */}
      <rect x="121" y="36" width="40" height="19" rx="9.5" fill="#fbbf24"/>
      <text x="141" y="49.5" fill="#78350f" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="'Arial', sans-serif">PRO</text>
      {/* Contactless */}
      <g transform="translate(306,70)" opacity="0.75">
        <path d="M10 26 Q19 9 28 26" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M5 32 Q19 3 33 32" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M0 38 Q19 -3 38 38" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
      {/* Number dots */}
      <text x="28" y="162" fill="rgba(255,255,255,0.55)" fontSize="17" letterSpacing="6" fontFamily="'Courier New', monospace">•••• •••• ••••</text>
      {/* Name & compat */}
      <text x="28" y="198" fill="white" fontSize="16" fontWeight="800" fontFamily="'Arial', sans-serif">FindCard PRO</text>
      <text x="28" y="215" fill="#93c5fd" fontSize="9" fontFamily="'Arial', sans-serif" letterSpacing="0.5">Apple Find My  ·  1.8mm  ·  IP67  ·  6-Month Battery</text>
      {/* MFI badge */}
      <rect x="291" y="188" width="42" height="22" rx="5" fill="white" opacity="0.12"/>
      <text x="312" y="203" fill="white" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="'Arial', sans-serif">MFi ✓</text>
    </svg>
  )
}

function AndroidCardSVG() {
  return (
    <svg viewBox="0 0 360 225" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto rounded-2xl" style={{ filter: 'drop-shadow(0 20px 40px rgba(6,78,59,0.45))' }}>
      <defs>
        <linearGradient id="andg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#065f46"/>
          <stop offset="100%" stopColor="#047857"/>
        </linearGradient>
        <linearGradient id="chg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7"/>
          <stop offset="100%" stopColor="#10b981"/>
        </linearGradient>
        <radialGradient id="glow2" cx="75%" cy="25%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="360" height="225" rx="20" fill="url(#andg)"/>
      <rect width="360" height="225" rx="20" fill="url(#glow2)"/>
      <circle cx="310" cy="-20" r="110" fill="none" stroke="white" strokeWidth="1" opacity="0.08"/>
      <circle cx="310" cy="-20" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
      <circle cx="50" cy="260" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
      {/* Chip */}
      <rect x="28" y="68" width="52" height="40" rx="7" fill="url(#chg2)"/>
      <rect x="28" y="68" width="52" height="40" rx="7" fill="none" stroke="#059669" strokeWidth="0.5" opacity="0.5"/>
      <line x1="41" y1="68" x2="41" y2="108" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="54" y1="68" x2="54" y2="108" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="67" y1="68" x2="67" y2="108" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="83" x2="80" y2="83" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="96" x2="80" y2="96" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      {/* Brand name */}
      <text x="28" y="50" fill="#6ee7b7" fontSize="10.5" fontWeight="700" letterSpacing="3.5" fontFamily="'Arial', sans-serif">FINDCARD</text>
      {/* Android badge */}
      <rect x="121" y="36" width="68" height="19" rx="9.5" fill="#34d399"/>
      <text x="155" y="49.5" fill="#064e3b" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="'Arial', sans-serif">ANDROID</text>
      {/* Contactless */}
      <g transform="translate(306,70)" opacity="0.75">
        <path d="M10 26 Q19 9 28 26" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M5 32 Q19 3 33 32" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M0 38 Q19 -3 38 38" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
      {/* Number dots */}
      <text x="28" y="162" fill="rgba(255,255,255,0.5)" fontSize="17" letterSpacing="6" fontFamily="'Courier New', monospace">•••• •••• ••••</text>
      {/* Name & compat */}
      <text x="28" y="198" fill="white" fontSize="16" fontWeight="800" fontFamily="'Arial', sans-serif">FindCard Android</text>
      <text x="28" y="215" fill="#6ee7b7" fontSize="9" fontFamily="'Arial', sans-serif" letterSpacing="0.5">Google Find My Device  ·  1.8mm  ·  IP67  ·  6-Month Battery</text>
    </svg>
  )
}

const SPECS = [
  ['גודל', '85.6 × 54 × 1.8 מ"מ'],
  ['משקל', '7 גרם'],
  ['סוללה', 'Li-Polymer נטענת אלחוטית (Qi)'],
  ['זמן טעינה', 'כ-2 שעות'],
  ['עמידות', 'IP67 (מים ואבק)'],
  ['טכנולוגיה', 'Bluetooth 5.1'],
  ['טווח', 'עד 90 מטר (Bluetooth ישיר)'],
  ['אחריות', '100 יום החזרת כסף'],
]

export default function ProductPage() {
  const [platform, setPlatform] = useState<Platform>('apple')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  const p = PRODUCTS[platform]
  const discount = Math.round((1 - p.sellingPrice / p.compareAtPrice) * 100)

  function handleAdd() {
    addItem({
      productId: p.id,
      slug: p.slug,
      nameHe: p.nameHe,
      image: '',
      sellingPrice: p.sellingPrice,
      quantity: qty,
      variantLabel: p.compatLabel,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  async function handleBuyNow() {
    addItem({
      productId: p.id,
      slug: p.slug,
      nameHe: p.nameHe,
      image: '',
      sellingPrice: p.sellingPrice,
      quantity: qty,
      variantLabel: p.compatLabel,
    })
    router.push('/checkout')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">בית</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">המוצר שלנו</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Platform selector */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3 text-center">בחר גרסה:</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setPlatform('apple'); setAdded(false) }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  platform === 'apple'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                🍎 Apple Find My
                {platform === 'apple' && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">נבחר</span>}
              </button>
              <button
                onClick={() => { setPlatform('android'); setAdded(false) }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                  platform === 'android'
                    ? 'border-green-600 bg-green-600 text-white shadow-lg shadow-green-200'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                }`}
              >
                🤖 Android
                {platform === 'android' && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">נבחר</span>}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left: Card image */}
            <div className="space-y-6">
              <div className={`rounded-3xl p-10 flex items-center justify-center transition-colors duration-300 ${
                platform === 'apple'
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-100'
                  : 'bg-gradient-to-br from-emerald-50 to-teal-100'
              }`}>
                {platform === 'apple' ? <AppleCardSVG /> : <AndroidCardSVG />}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '🛡️', text: '100 יום\nהחזר כסף' },
                  { icon: '🚚', text: 'משלוח חינם\nעל כל הזמנה' },
                  { icon: '🔒', text: 'תשלום\nמאובטח' },
                ].map(({ icon, text }) => (
                  <div key={text} className="bg-gray-50 rounded-xl p-3 border">
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-xs text-gray-600 whitespace-pre-line font-medium">{text}</p>
                  </div>
                ))}
              </div>

              {/* Compat badge */}
              <div className={`rounded-xl p-3 text-sm text-center font-medium border ${
                platform === 'apple'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                {platform === 'apple' ? '🍎' : '🤖'} תואם: {p.compat}
              </div>
            </div>

            {/* Right: Product info */}
            <div className="space-y-5">
              <div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">במלאי ✓</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-2">
                  {p.nameHe}
                </h1>
                <p className="text-gray-500 leading-relaxed">{p.descriptionHe}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl font-black ${platform === 'apple' ? 'text-blue-600' : 'text-green-600'}`}>
                  {formatPrice(p.sellingPrice)}
                </span>
                <span className="text-xl text-gray-400 line-through">{formatPrice(p.compareAtPrice)}</span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-lg">
                  חסוך {discount}%
                </span>
              </div>

              {/* Urgency */}
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                <span className="text-base">🔥</span>
                <span><strong>נגמר בקרוב!</strong> מבצע מוגבל — קנה 2 וקבל 1 חינם</span>
              </div>

              {/* Features */}
              <div className={`rounded-2xl p-5 ${platform === 'apple' ? 'bg-blue-50' : 'bg-green-50'}`}>
                <p className="font-bold text-gray-900 mb-3">מה כלול:</p>
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className={`font-bold flex-shrink-0 ${platform === 'apple' ? 'text-blue-500' : 'text-green-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quantity */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">כמות:</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold flex items-center justify-center hover:bg-gray-50"
                  >−</button>
                  <span className="text-xl font-bold w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold flex items-center justify-center hover:bg-gray-50"
                  >+</button>
                  {qty >= 2 && (
                    <span className="text-sm text-green-600 font-medium">🎁 קנה 2 קבל 1 חינם!</span>
                  )}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-yellow-400 text-yellow-900 font-extrabold py-4 rounded-xl hover:bg-yellow-300 transition-colors text-lg shadow-lg"
                >
                  קנה עכשיו ←
                </button>
                <button
                  onClick={handleAdd}
                  className={`w-full text-white font-bold py-4 rounded-xl transition-colors text-lg ${
                    platform === 'apple'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {added ? '✓ נוסף לסל!' : 'הוסף לסל'}
                </button>
              </div>

              {/* Delivery */}
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="font-semibold text-gray-900">משלוח חינם לכל הארץ</p>
                  <p className="text-xs text-gray-500">מגיע תוך 3-5 ימי עסקים</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specs + Differentiators */}
          <div className="mt-16 border-t pt-14">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">פרטי המוצר</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">מפרט טכני</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-200">
                    {SPECS.map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2.5 font-medium text-gray-700">{k}</td>
                        <td className="py-2.5 text-gray-600">
                          {k === 'טכנולוגיה'
                            ? `${v} + ${platform === 'apple' ? 'Apple Find My' : 'Google Find My Device'}`
                            : v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`rounded-2xl p-6 ${platform === 'apple' ? 'bg-blue-50' : 'bg-green-50'}`}>
                <h3 className="font-bold text-gray-900 mb-4">במה FindCard שונה?</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  {[
                    'הכרטיס הדק ביותר בשוק — 1.8מ"מ בלבד, לא תרגיש אותו',
                    'לא צריך להחליף סוללה לעולם — רק לטעון אלחוטית',
                    platform === 'apple'
                      ? 'עובד ישירות מ-Find My — ללא אפליקציה נוספת'
                      : 'עובד ישירות מ-Google Find My Device — מותקן מראש',
                    platform === 'apple'
                      ? 'רשת מיקום של מאות מיליוני מכשירי Apple'
                      : 'רשת מיקום של מיליארד+ מכשירי Android',
                    'הגדרה של 30 שניות בלבד — פשוט לגמרי',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className={`font-bold mt-0.5 flex-shrink-0 ${platform === 'apple' ? 'text-blue-500' : 'text-green-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Social proof strip */}
          <div className="mt-10 bg-gray-50 rounded-2xl p-6 border text-center">
            <p className="text-2xl font-extrabold text-gray-900 mb-1">⭐ 4.9 / 5</p>
            <p className="text-gray-500 text-sm">מבוסס על 2,847 ביקורות מאומתות · 100,000+ לקוחות מרוצים</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
