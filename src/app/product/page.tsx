'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import { useRouter } from 'next/navigation'

type Platform = 'apple' | 'android'

const PRODUCTS = {
  apple: {
    id: 'kartis-maakav-smart-pro',
    slug: 'kartis-maakav-smart-pro',
    nameHe: 'כרטיס מעקב FindCard PRO',
    descriptionHe: 'כרטיס מעקב חכם תואם Apple Find My. דק בדיוק 1.8מ"מ — נכנס לכל ארנק ומוצא את המפתחות, הארנק וכל דבר אחר תוך שניות.',
    compatLabel: 'Apple Find My',
    compat: 'iPhone ו-iPad בלבד (iOS 14.5+)',
    features: [
      'דק 1.8מ"מ — נכנס לכל ארנק בנוחות',
      'תואם Apple Find My — ללא מנוי חודשי',
      'סוללה נטענת אלחוטית עד 8 חודשים',
      'התראה קולית חזקה בלחיצת כפתור',
      'עמיד בפני מים IP67 (עד 1 מטר)',
      'הגדרה ראשונית תוך 30 שניות',
    ],
    tiers: [
      { qty: 1, label: '1 כרטיס', price: 16900, compareAt: 24900, badge: null, badgeColor: '', gift: null },
      { qty: 2, label: '2 כרטיסים', price: 29900, compareAt: 49800, badge: '72% מהלקוחות בחרו', badgeColor: 'bg-blue-600', gift: '🎁 מתנת הפתעה בשווי ₪50' },
      { qty: 3, label: '3 כרטיסים', price: 33800, compareAt: 74700, badge: 'הכי משתלם!', badgeColor: 'bg-orange-500', gift: '🎁 מתנת פרמיום בשווי ₪150' },
    ],
  },
  android: {
    id: 'kartis-maakav-android-pro',
    slug: 'kartis-maakav-android-pro',
    nameHe: 'כרטיס מעקב FindCard Android',
    descriptionHe: 'כרטיס מעקב חכם תואם Google Find My Device. עובד עם כל מכשיר Android — מצא את הארנק, המפתחות וכל דבר אחר בשניות.',
    compatLabel: 'Google Find My Device',
    compat: 'Android 6.0+ עם Google Play Services',
    features: [
      'דק 1.8מ"מ — נכנס לכל ארנק בנוחות',
      'תואם Google Find My Device — ללא מנוי',
      'סוללה נטענת אלחוטית עד 8 חודשים',
      'התראה קולית חזקה בלחיצת כפתור',
      'עמיד בפני מים IP67 (עד 1 מטר)',
      'הגדרה ראשונית תוך 30 שניות',
    ],
    tiers: [
      { qty: 1, label: '1 כרטיס', price: 14900, compareAt: 22900, badge: null, badgeColor: '', gift: null },
      { qty: 2, label: '2 כרטיסים', price: 26900, compareAt: 45800, badge: '72% מהלקוחות בחרו', badgeColor: 'bg-green-600', gift: '🎁 מתנת הפתעה בשווי ₪50' },
      { qty: 3, label: '3 כרטיסים', price: 29800, compareAt: 68700, badge: 'הכי משתלם!', badgeColor: 'bg-orange-500', gift: '🎁 מתנת פרמיום בשווי ₪150' },
    ],
  },
}

const SPECS = [
  ['גודל', '85.6 × 54 × 1.8 מ"מ'],
  ['משקל', '7 גרם'],
  ['סוללה', 'Li-Polymer נטענת אלחוטית (Qi)'],
  ['זמן טעינה', 'כ-2 שעות'],
  ['חיי סוללה', 'עד 8 חודשים'],
  ['עמידות', 'IP67 (מים ואבק)'],
  ['טכנולוגיה', 'Bluetooth 5.1'],
  ['טווח', 'עד 90 מטר (Bluetooth ישיר)'],
  ['אחריות', '100 יום החזרת כסף'],
]

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
      <circle cx="310" cy="-20" r="110" fill="none" stroke="white" strokeWidth="1" opacity="0.08"/>
      <circle cx="310" cy="-20" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
      <circle cx="50" cy="260" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.06"/>
      <rect x="28" y="68" width="52" height="40" rx="7" fill="url(#chg)"/>
      <line x1="41" y1="68" x2="41" y2="108" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="54" y1="68" x2="54" y2="108" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="67" y1="68" x2="67" y2="108" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="83" x2="80" y2="83" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="96" x2="80" y2="96" stroke="#b45309" strokeWidth="0.7" opacity="0.5"/>
      <text x="28" y="50" fill="#93c5fd" fontSize="10.5" fontWeight="700" letterSpacing="3.5" fontFamily="'Arial', sans-serif">FINDCARD</text>
      <rect x="121" y="36" width="40" height="19" rx="9.5" fill="#fbbf24"/>
      <text x="141" y="49.5" fill="#78350f" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="'Arial', sans-serif">PRO</text>
      <g transform="translate(306,70)" opacity="0.75">
        <path d="M10 26 Q19 9 28 26" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M5 32 Q19 3 33 32" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M0 38 Q19 -3 38 38" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
      <text x="28" y="162" fill="rgba(255,255,255,0.55)" fontSize="17" letterSpacing="6" fontFamily="'Courier New', monospace">•••• •••• ••••</text>
      <text x="28" y="198" fill="white" fontSize="16" fontWeight="800" fontFamily="'Arial', sans-serif">FindCard PRO</text>
      <text x="28" y="215" fill="#93c5fd" fontSize="9" fontFamily="'Arial', sans-serif" letterSpacing="0.5">Apple Find My  ·  1.8mm  ·  IP67  ·  8-Month Battery</text>
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
      <rect x="28" y="68" width="52" height="40" rx="7" fill="url(#chg2)"/>
      <line x1="41" y1="68" x2="41" y2="108" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="54" y1="68" x2="54" y2="108" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="67" y1="68" x2="67" y2="108" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="83" x2="80" y2="83" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <line x1="28" y1="96" x2="80" y2="96" stroke="#047857" strokeWidth="0.7" opacity="0.5"/>
      <text x="28" y="50" fill="#6ee7b7" fontSize="10.5" fontWeight="700" letterSpacing="3.5" fontFamily="'Arial', sans-serif">FINDCARD</text>
      <rect x="121" y="36" width="68" height="19" rx="9.5" fill="#34d399"/>
      <text x="155" y="49.5" fill="#064e3b" fontSize="9.5" fontWeight="800" textAnchor="middle" fontFamily="'Arial', sans-serif">ANDROID</text>
      <g transform="translate(306,70)" opacity="0.75">
        <path d="M10 26 Q19 9 28 26" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M5 32 Q19 3 33 32" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M0 38 Q19 -3 38 38" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      </g>
      <text x="28" y="162" fill="rgba(255,255,255,0.5)" fontSize="17" letterSpacing="6" fontFamily="'Courier New', monospace">•••• •••• ••••</text>
      <text x="28" y="198" fill="white" fontSize="16" fontWeight="800" fontFamily="'Arial', sans-serif">FindCard Android</text>
      <text x="28" y="215" fill="#6ee7b7" fontSize="9" fontFamily="'Arial', sans-serif" letterSpacing="0.5">Google Find My Device  ·  1.8mm  ·  IP67  ·  8-Month Battery</text>
    </svg>
  )
}

export default function ProductPage() {
  const [platform, setPlatform] = useState<Platform>('apple')
  const [tierIndex, setTierIndex] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  const p = PRODUCTS[platform]
  const tier = p.tiers[tierIndex]
  const saveAmount = tier.compareAt - tier.price
  const savePercent = Math.round((saveAmount / tier.compareAt) * 100)
  const pricePerUnit = Math.round(tier.price / tier.qty)

  function handleAdd() {
    addItem({
      productId: p.id,
      slug: p.slug,
      nameHe: p.nameHe,
      image: '',
      sellingPrice: tier.price,
      quantity: tier.qty,
      variantLabel: `${p.compatLabel} × ${tier.qty}`,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    addItem({
      productId: p.id,
      slug: p.slug,
      nameHe: p.nameHe,
      image: '',
      sellingPrice: tier.price,
      quantity: tier.qty,
      variantLabel: `${p.compatLabel} × ${tier.qty}`,
    })
    router.push('/checkout')
  }

  const accentBlue = platform === 'apple'
  const accent = accentBlue ? 'blue' : 'green'

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
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold text-gray-600 mb-3">בחר גרסה — לאיזה טלפון יש לך?</p>
            <div className="inline-flex gap-3 p-1 bg-gray-100 rounded-2xl">
              {(['apple', 'android'] as Platform[]).map((pl) => (
                <button
                  key={pl}
                  onClick={() => { setPlatform(pl); setTierIndex(1); setAdded(false) }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    platform === pl
                      ? pl === 'apple'
                        ? 'bg-white shadow-md text-blue-700'
                        : 'bg-white shadow-md text-green-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {pl === 'apple' ? '🍎 Apple Find My' : '🤖 Android'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left: Card image */}
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className={`rounded-3xl p-10 flex items-center justify-center transition-colors duration-300 ${
                accentBlue ? 'bg-gradient-to-br from-blue-50 to-indigo-100' : 'bg-gradient-to-br from-emerald-50 to-teal-100'
              }`}>
                {accentBlue ? <AppleCardSVG /> : <AndroidCardSVG />}
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

              {/* Compat note */}
              <div className={`rounded-xl p-3 text-sm text-center font-medium border ${
                accentBlue ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                {accentBlue ? '🍎' : '🤖'} תואם: {p.compat}
              </div>
            </div>

            {/* Right: Product info */}
            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">במלאי ✓</span>
                  <span className="text-xs text-gray-400">⭐ 4.9 · 2,847 ביקורות</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{p.nameHe}</h1>
                <p className="text-gray-500 leading-relaxed text-sm">{p.descriptionHe}</p>
              </div>

              {/* Urgency */}
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                <span>🔥</span>
                <span><strong>מבצע מוגבל:</strong> 24 שעות אחרונות למחיר הזה!</span>
              </div>

              {/* Tier selector */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">בחר כמות:</p>
                <div className="space-y-3">
                  {p.tiers.map((t, i) => {
                    const tierSave = t.compareAt - t.price
                    const tierSavePct = Math.round((tierSave / t.compareAt) * 100)
                    const isSelected = tierIndex === i
                    return (
                      <button
                        key={i}
                        onClick={() => setTierIndex(i)}
                        className={`w-full text-right border-2 rounded-xl px-4 py-3.5 transition-all relative ${
                          isSelected
                            ? accentBlue
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-green-600 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {/* Badge */}
                        {t.badge && (
                          <span className={`absolute -top-2.5 right-3 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ${t.badgeColor}`}>
                            {t.badge}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Radio circle */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? accentBlue ? 'border-blue-600' : 'border-green-600'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <div className={`w-2.5 h-2.5 rounded-full ${accentBlue ? 'bg-blue-600' : 'bg-green-600'}`} />
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">{t.label}</p>
                              {t.gift && <p className="text-xs text-orange-600 font-medium">{t.gift}</p>}
                            </div>
                          </div>
                          <div className="text-left">
                            <p className={`text-lg font-black ${isSelected ? (accentBlue ? 'text-blue-600' : 'text-green-600') : 'text-gray-900'}`}>
                              {formatPrice(t.price)}
                            </p>
                            <p className="text-xs text-gray-400 line-through">{formatPrice(t.compareAt)}</p>
                            <p className="text-xs font-bold text-green-600">חסוך {tierSavePct}%</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selected tier summary */}
              <div className={`rounded-xl p-4 text-sm border ${
                accentBlue ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">
                    {tier.qty} כרטיס{tier.qty > 1 ? 'ים' : ''} · {formatPrice(pricePerUnit)} ליחידה
                  </span>
                  <span className="font-extrabold text-lg text-gray-900">{formatPrice(tier.price)}</span>
                </div>
                <p className="text-green-600 font-bold text-xs mt-1">✓ חסכת {formatPrice(saveAmount)} ({savePercent}% הנחה)</p>
                {tier.gift && <p className="text-orange-600 font-medium text-xs mt-0.5">{tier.gift} נוסף בחינם</p>}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-yellow-400 text-yellow-900 font-extrabold py-4 rounded-xl hover:bg-yellow-300 transition-colors text-lg shadow-lg"
                >
                  קנה עכשיו ← {formatPrice(tier.price)}
                </button>
                <button
                  onClick={handleAdd}
                  className={`w-full text-white font-bold py-4 rounded-xl transition-colors text-lg ${
                    accentBlue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {added ? '✓ נוסף לסל! 🛒' : 'הוסף לסל 🛒'}
                </button>
              </div>

              {/* Delivery */}
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="font-semibold text-gray-900">משלוח חינם לכל הארץ</p>
                  <p className="text-xs text-gray-500">מגיע תוך 3-5 ימי עסקים · מספר מעקב נשלח למייל</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features + Specs */}
          <div className="mt-16 border-t pt-14">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">פרטי המוצר</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Features */}
              <div className={`rounded-2xl p-6 ${accentBlue ? 'bg-blue-50' : 'bg-green-50'}`}>
                <h3 className="font-bold text-gray-900 mb-4">מה כלול:</h3>
                <ul className="space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className={`font-bold flex-shrink-0 ${accentBlue ? 'text-blue-500' : 'text-green-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specs */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">מפרט טכני:</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-200">
                    {SPECS.map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 font-medium text-gray-700">{k}</td>
                        <td className="py-2 text-gray-600">
                          {k === 'טכנולוגיה'
                            ? `${v} + ${accentBlue ? 'Apple Find My' : 'Google Find My Device'}`
                            : v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Why FindCard */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
              <h3 className="font-bold text-xl mb-5 text-center">במה FindCard שונה?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: '💳', text: 'הכרטיס הדק ביותר בשוק — 1.8מ"מ בלבד' },
                  { icon: '🔋', text: 'לא צריך להחליף סוללה לעולם — רק לטעון אלחוטית' },
                  { icon: '🌐', text: accentBlue ? 'רשת מיקום של מאות מיליוני מכשירי Apple' : 'רשת מיקום של מיליארד+ מכשירי Android' },
                  { icon: '⚡', text: 'הגדרה של 30 שניות בלבד — פשוט לגמרי' },
                  { icon: '🛡️', text: '100 יום אחריות להחזרת כסף ללא שאלות' },
                  { icon: '🌊', text: 'עמיד בגשם, שלג ולחות — IP67 מאושר' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-6 border text-center">
            <p className="text-2xl font-extrabold text-gray-900 mb-1">⭐ 4.9 / 5</p>
            <p className="text-gray-500 text-sm">מבוסס על 2,847 ביקורות מאומתות · 100,000+ לקוחות מרוצים</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
