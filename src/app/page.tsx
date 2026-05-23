'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'

const PRODUCT_SLUG = 'kartis-maakav-smart-pro'
const PRODUCT_ID = '68312eb0a0b4cce7374fdea1' // will be resolved client-side
const SELLING_PRICE = 16900  // ₪169
const COMPARE_PRICE = 24900  // ₪249

const FEATURES = [
  { icon: '📡', title: 'Apple Find My', sub: 'תואם 100% למערכת של Apple' },
  { icon: '🔊', title: 'התראות קוליות', sub: 'מצא בשניות עם צליל חד' },
  { icon: '🔋', title: 'טעינה אלחוטית', sub: 'סוללה עד 6 חודשים' },
  { icon: '💳', title: 'דק כמו כרטיס', sub: 'נכנס לכל ארנק בנוחות' },
]

const REVIEWS = [
  { name: 'דנה כ.', text: 'מצאתי את הארנק שלי תוך שניות! המוצר שינה את חיי. ממליצה בחום לכולם!' },
  { name: 'אבי מ.', text: 'קניתי שלושה — לי, לאשתי ולילד. שקט נפשי אמיתי בכל יום.' },
  { name: 'שירה ל.', text: 'עיצוב דק ואלגנטי, נכנס לארנק בצורה מושלמת. עובד מעולה!' },
]

const FAQS = [
  { q: 'איך זה עובד?', a: 'FindCard מתחבר לרשת ה-Find My של Apple. כשתרצה למצוא את הארנק שלך, פשוט פתח את האפליקציה Find My באייפון ותקבל את המיקום המדויק.' },
  { q: 'האם זה מתאים לאנדרואיד?', a: 'FindCard עובד בצורה מיטבית עם מכשירי iPhone ו-iPad עם iOS 14.5 ומעלה. עבור אנדרואיד ניתן להשתמש בפונקציית הצליל.' },
  { q: 'כמה זמן הסוללה מחזיקה?', a: 'הסוללה מחזיקה עד 6 חודשים בשימוש יומיומי. הטעינה אלחוטית — מניחים על משטח Qi ותוך שעתיים מלא.' },
  { q: 'כמה זמן המשלוח?', a: 'משלוח לכל הארץ תוך 3-5 ימי עסקים. משלוח חינם לרכישה מעל ₪300.' },
  { q: 'מה כוללת האחריות?', a: '100 יום אחריות מלאה להחזרת כסף, ללא שאלות. אם לא מרוצה — מחזירים לך את הכסף.' },
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const addItem = useCartStore((s) => s.addItem)

  function addToCart() {
    addItem({
      productId: 'kartis-maakav-smart-pro',
      slug: PRODUCT_SLUG,
      nameHe: 'כרטיס מעקב FindCard PRO',
      image: 'https://via.placeholder.com/600x600/2563EB/FFFFFF?text=FindCard+PRO',
      sellingPrice: SELLING_PRICE,
      quantity: 1,
      variantLabel: '',
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 text-center md:text-right">
                <div className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1.5 rounded-full mb-5">
                  🎉 מבצע — קנה 2, קבל 1 חינם
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-5">
                  מצא את כל<br className="hidden md:block" />
                  <span className="text-yellow-300">מה שאיבדת</span>
                </h1>
                <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-lg mx-auto md:mx-0">
                  FindCard — כרטיס המעקב החכם שנכנס לארנק שלך. תואם Apple Find My, דק כמו כרטיס אשראי ומוצא הכל תוך שניות.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link href="/product"
                    className="bg-yellow-400 text-yellow-900 font-bold px-8 py-3.5 rounded-xl hover:bg-yellow-300 transition-colors text-lg shadow-lg">
                    לרכישה עכשיו ←
                  </Link>
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-lg">
                    קרא עוד
                  </button>
                </div>
                <div className="flex items-center gap-6 mt-8 text-sm text-blue-100 justify-center md:justify-start">
                  <span>✅ 100 יום החזר כסף</span>
                  <span>🚚 משלוח חינם מ-₪300</span>
                </div>
              </div>
              {/* Hero product image */}
              <div className="flex-shrink-0 w-72 h-72 md:w-80 md:h-80 relative">
                <div className="w-full h-full rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <div className="text-8xl mb-3">💳</div>
                    <p className="text-white font-bold text-xl">FindCard PRO</p>
                    <p className="text-blue-200 text-sm mt-1">כרטיס מעקב חכם</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES STRIP ── */}
        <section id="features" className="bg-gray-50 border-b py-10 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {FEATURES.map(({ icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <span className="text-4xl">{icon}</span>
                <p className="font-bold text-gray-900 text-sm">{title}</p>
                <p className="text-gray-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRODUCT PREVIEW ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
            <div className="order-2 md:order-1 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl aspect-square flex items-center justify-center shadow-inner">
              <div className="text-center">
                <div className="text-9xl mb-4">💳</div>
                <p className="text-blue-700 font-bold text-2xl">FindCard PRO</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">המוצר הנמכר ביותר</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-4">
                כרטיס מעקב <span className="text-blue-600">FindCard PRO</span>
              </h2>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-blue-600">₪169</span>
                <span className="text-xl text-gray-400 line-through">₪249</span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded">חסוך 32%</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'דק כמו כרטיס אשראי — נכנס לכל ארנק',
                  'תואם Apple Find My — ללא מנוי',
                  'סוללה נטענת אלחוטית עד 6 חודשים',
                  'התראה קולית חזקה בלחיצת כפתור',
                  'עמיד בפני מים (IP67)',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-700">
                    <span className="text-blue-500 font-bold text-lg flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/product"
                  className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors text-center text-lg flex-1">
                  קנה עכשיו
                </Link>
                <button onClick={addToCart}
                  className="border-2 border-blue-600 text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-lg">
                  הוסף לסל
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-10">
              למה לבחור ב-FindCard?
            </h2>
            <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right px-6 py-4 font-semibold text-gray-500">תכונה</th>
                    <th className="px-6 py-4 font-bold text-blue-600 text-center bg-blue-50">
                      <span className="text-blue-600">Find</span><span className="text-gray-900">Card</span>
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-400 text-center">מתחרים</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ['דק כמו כרטיס אשראי', '✅', '❌'],
                    ['Apple Find My', '✅', '✅'],
                    ['טעינה אלחוטית', '✅', '❌'],
                    ['ללא החלפת סוללה', '✅', '❌'],
                    ['מחיר', '₪169', '₪350+'],
                    ['100 יום החזר כסף', '✅', '❌'],
                  ].map(([feature, us, them]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-700">{feature}</td>
                      <td className="px-6 py-3 text-center font-medium text-blue-600 bg-blue-50/50">{us}</td>
                      <td className="px-6 py-3 text-center text-gray-400">{them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── GUARANTEE ── */}
        <section className="bg-blue-600 text-white py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">100 יום אחריות להחזרת כסף</h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">
              לא מרוצה? שלח לנו הודעה ונחזיר לך את הכסף — ללא שאלות, ללא טרחה.
            </p>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-10">
            מה הלקוחות שלנו אומרים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map(({ name, text }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex mb-3">
                  {'★★★★★'.split('').map((s, i) => <span key={i} className="text-yellow-400 text-xl">{s}</span>)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{text}"</p>
                <p className="font-bold text-sm text-gray-900">{name}</p>
                <p className="text-xs text-gray-400">לקוח מאומת ✓</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-10">
              שאלות נפוצות
            </h2>
            <div className="space-y-3">
              {FAQS.map(({ q, a }, i) => (
                <div key={i} className="bg-white border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-right font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {q}
                    <span className={`text-gray-400 text-xl transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t pt-3">{a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            מוכן להפסיק לאבד דברים?
          </h2>
          <p className="text-gray-500 text-lg mb-8">הזמן עכשיו וקבל משלוח חינם תוך 3-5 ימי עסקים</p>
          <Link href="/product"
            className="inline-block bg-blue-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-blue-700 transition-colors text-xl shadow-lg">
            הזמן את FindCard ←
          </Link>
        </section>

      </main>
      <Footer />
    </div>
  )
}
