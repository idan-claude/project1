'use client'
import Link from 'next/link'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'

const PRODUCT_SLUG = 'kartis-maakav-smart-pro'
const SELLING_PRICE = 16900
const COMPARE_PRICE = 24900

const FEATURES = [
  { icon: '📡', title: 'Apple Find My', sub: 'רשת של מיליוני מכשירי Apple בכל העולם' },
  { icon: '🔊', title: 'התראה קולית', sub: 'צליל חזק בלחיצה אחת — מצא בשניות' },
  { icon: '🔋', title: '6 חודשי סוללה', sub: 'טעינה אלחוטית Qi, אחת לחצי שנה' },
  { icon: '💳', title: 'עובי 1.8 מ"מ', sub: 'דק בדיוק כמו כרטיס אשראי' },
  { icon: '🌊', title: 'עמיד IP67', sub: 'מוגן מפני מים ואבק בכל מזג אוויר' },
  { icon: '⚡', title: 'הגדרה 30 שניות', sub: 'ללא אפליקציות נוספות — ישירות Find My' },
]

const SETUP_STEPS = [
  { step: '01', icon: '👜', title: 'הכנס לארנק', desc: 'הכרטיס דק 1.8מ"מ — נכנס לכל תא כרטיסים בלי להרגיש אותו' },
  { step: '02', icon: '📱', title: 'פתח Find My', desc: 'פשוט פתח את אפליקציית Find My של Apple — ללא הורדות, ללא הרשמה' },
  { step: '03', icon: '🎯', title: 'מצא תמיד', desc: 'ראה את מיקום הארנק שלך בזמן אמת, בכל מקום בעולם' },
]

const REVIEWS = [
  {
    initials: 'ד', color: 'bg-blue-500',
    name: 'דנה כ.', location: 'תל אביב',
    text: 'כבר שנתיים הייתי מאבדת את הארנק שלי בבית פעמיים בשבוע. מאז שקיבלתי את FindCard — פשוט פותחת את Find My ומוצאת אותו תוך 5 שניות. שינה לי את החיים!',
    detail: 'השתמשתי בו כבר 3 חודשים',
  },
  {
    initials: 'א', color: 'bg-green-500',
    name: 'אבי מ.', location: 'חיפה',
    text: 'קניתי שלושה — אחד לי, אחד לאשתי ואחד לבן ה-14 עם התיק הספרים. ממש שקט נפשי לכל המשפחה. המשלוח הגיע תוך 4 ימים, אריזה מושלמת.',
    detail: 'קנה 3 יחידות',
  },
  {
    initials: 'ש', color: 'bg-purple-500',
    name: 'שירה ל.', location: 'ירושלים',
    text: 'טסתי לחו"ל ואיבדתי את המזוודה בשדה התעופה. הצלחתי לראות בדיוק איפה היא עומדת ולהגיד לאנשי השדה. הציל לי את החופשה!',
    detail: 'משתמשת 5 חודשים',
  },
]

const FAQS = [
  { q: 'איך FindCard עובד?', a: 'FindCard משתמש בטכנולוגיית Bluetooth 5.1 ומתחבר לרשת ה-Find My של Apple. כל מכשיר iPhone בסביבה מדווח על מיקום הכרטיס לשרתי Apple — ואתה מקבל את המיקום המדויק דרך האפליקציה, ללא ידיעת הסביבה.' },
  { q: 'האם זה עובד עם אנדרואיד?', a: 'גרסת Apple Find My עובדת עם iPhone ו-iPad בלבד (iOS 14.5+). יש לנו גם גרסת Android התואמת ל-Google Find My Device — ניתן לבחור בדף המוצר.' },
  { q: 'כמה עבה הכרטיס?', a: 'בדיוק 1.8 מ"מ — אותו עובי של כרטיס אשראי. נכנס לכל תא כרטיסים, בכל ארנק, מבלי ליצור בליטה.' },
  { q: 'כמה זמן הסוללה מחזיקה?', a: 'עד 6 חודשים בשימוש יומיומי. טעינה אלחוטית (Qi) — מניחים על משטח טעינה ותוך שעתיים הסוללה מלאה. לא צריך להחליף סוללה לעולם.' },
  { q: 'מה הטווח המקסימלי?', a: 'טווח Bluetooth ישיר של עד 90 מטר. מחוץ לטווח — רשת Find My ממשיכה לעדכן את המיקום דרך כל iPhone בסביבה, כך שניתן לאתר בכל מקום בעולם.' },
  { q: 'האם הכרטיס עמיד במים?', a: 'כן! FindCard מדורג IP67 — עמיד בשקיעה במים עד עומק 1 מטר למשך 30 דקות. עמיד גם בגשם, שלג ולחות.' },
  { q: 'כמה זמן ההגדרה הראשונית?', a: 'כ-30 שניות בלבד. פשוט פתח את אפליקציית Find My באייפון, לחץ על "הוסף מכשיר" ואת/ה מוכן/ה. אין צורך בהורדת אפליקציה נוספת.' },
  { q: 'מה כוללת האחריות?', a: '100 יום אחריות מלאה להחזרת כסף — ללא שאלות. אם המוצר לא מתאים לך מכל סיבה שהיא, נחזיר לך את הכסף במלואו.' },
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  function addToCart() {
    addItem({
      productId: PRODUCT_SLUG,
      slug: PRODUCT_SLUG,
      nameHe: 'כרטיס מעקב FindCard PRO',
      image: '',
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
                  🎉 מבצע — קנה 2, קבל 1 חינם · נגמר בקרוב!
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-5">
                  מצא את כל<br className="hidden md:block" />
                  <span className="text-yellow-300">מה שאיבדת</span>
                </h1>
                <p className="text-blue-100 text-lg md:text-xl mb-6 max-w-lg mx-auto md:mx-0">
                  FindCard — כרטיס המעקב החכם שנכנס לארנק שלך. תואם Apple Find My, דק כמו כרטיס אשראי ומוצא הכל תוך שניות.
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-8 justify-center md:justify-start text-sm">
                  <span className="bg-white/15 rounded-full px-3 py-1 font-medium">✅ Apple MFI מאושר</span>
                  <span className="bg-white/15 rounded-full px-3 py-1 font-medium">⭐ 4.9/5 · 2,847 ביקורות</span>
                  <span className="bg-white/15 rounded-full px-3 py-1 font-medium">👥 100,000+ לקוחות</span>
                </div>
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
              <div className="flex-shrink-0 w-72 h-72 md:w-80 md:h-80">
                <div className="w-full h-full rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <div className="text-8xl mb-3">💳</div>
                    <p className="text-white font-bold text-xl">FindCard PRO</p>
                    <p className="text-blue-200 text-sm mt-1">כרטיס מעקב חכם</p>
                    <p className="text-blue-300 text-xs mt-1.5">עובי 1.8מ"מ · IP67 · 6 חודשי סוללה</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES STRIP ── */}
        <section id="features" className="bg-white border-b py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
              {FEATURES.map(({ icon, title, sub }) => (
                <div key={title} className="flex flex-col items-center gap-2">
                  <span className="text-4xl">{icon}</span>
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs leading-snug">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCT PREVIEW ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
            <div className="order-2 md:order-1 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl aspect-square flex items-center justify-center shadow-inner">
              <div className="text-center">
                <div className="text-9xl mb-4">💳</div>
                <p className="text-blue-700 font-bold text-2xl">FindCard PRO</p>
                <p className="text-blue-500 text-sm mt-2">עובי 1.8מ"מ · טווח 90 מטר</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">במלאי — 100,000+ לקוחות מרוצים</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-2">
                כרטיס מעקב <span className="text-blue-600">FindCard PRO</span>
              </h2>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-blue-600">₪169</span>
                <span className="text-xl text-gray-400 line-through">₪249</span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded">חסוך 32%</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'דק בדיוק 1.8 מ"מ — נכנס לכל ארנק',
                  'תואם Apple Find My — ללא מנוי חודשי',
                  'סוללה נטענת אלחוטית עד 6 חודשים',
                  'התראה קולית חזקה בלחיצת כפתור',
                  'עמיד בפני מים (IP67)',
                  'הגדרה ראשונית תוך 30 שניות',
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
              <p className="text-xs text-gray-400 mt-3 text-center">🔥 נשארו מעט יחידות במלאי — הזמן עכשיו</p>
            </div>
          </div>
        </section>

        {/* ── SETUP STEPS ── */}
        <section className="bg-blue-600 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">הגדרה תוך 30 שניות</h2>
            <p className="text-blue-100 mb-12">ללא אפליקציות נוספות, ללא הרשמה. פשוט תכניס ותתחיל לעקוב.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {SETUP_STEPS.map(({ step, icon, title, desc }) => (
                <div key={step} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-4xl mb-3">{icon}</div>
                  <div className="text-blue-200 text-xs font-bold mb-1">שלב {step}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
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
                    ['עובי 1.8 מ"מ (כמו כרטיס אשראי)', '✅', '❌'],
                    ['Apple Find My מאושר', '✅', '✅'],
                    ['טעינה אלחוטית (Qi)', '✅', '❌'],
                    ['ללא החלפת סוללה לעולם', '✅', '❌'],
                    ['מחיר', '₪169', '₪350+'],
                    ['100 יום החזר כסף', '✅', '❌'],
                    ['IP67 עמיד במים', '✅', '⚠️ חלקי'],
                  ].map(([feature, us, them]) => (
                    <tr key={String(feature)} className="hover:bg-gray-50">
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
        <section className="bg-gray-900 text-white py-14 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl mb-4">🛡️</div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">100 יום אחריות להחזרת כסף</h2>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              לא מרוצה? שלח לנו הודעה ונחזיר לך את הכסף — ללא שאלות, ללא טרחה. אנחנו בטוחים שתאהב.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
              <span>✅ Apple MFI מאושר</span>
              <span>✅ IP67 עמיד במים</span>
              <span>✅ 100 יום החזר כסף</span>
              <span>✅ משלוח חינם מ-₪300</span>
            </div>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-2">
            מה הלקוחות שלנו אומרים
          </h2>
          <p className="text-center text-gray-500 mb-10">⭐ 4.9 / 5 · מעל 2,847 ביקורות מאומתות</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map(({ initials, color, name, location, text, detail }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-full ${color} text-white font-bold text-lg flex items-center justify-center flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{location}</p>
                  </div>
                  <span className="mr-auto text-xs bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">ביקורת מאומתת ✓</span>
                </div>
                <div className="flex mb-3">
                  {'★★★★★'.split('').map((s, i) => <span key={i} className="text-yellow-400 text-lg">{s}</span>)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1">"{text}"</p>
                <p className="text-xs text-gray-400 mt-4 pt-3 border-t">{detail}</p>
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

        {/* ── NEWSLETTER ── */}
        <section className="bg-blue-50 border-t border-blue-100 py-14 px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">קבל 10% הנחה</h2>
            <p className="text-gray-500 mb-6">הירשם לרשימת המייל שלנו וקבל קוד הנחה בלעדי להזמנה הראשונה שלך</p>
            {subscribed ? (
              <div className="bg-green-100 text-green-700 font-bold rounded-xl py-3 px-6">
                ✅ נרשמת בהצלחה! קוד ההנחה בדרך אליך.
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true) }}
                className="flex gap-2 max-w-sm mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="האימייל שלך"
                  required
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <button type="submit" className="bg-blue-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
                  שלח לי
                </button>
              </form>
            )}
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
          <p className="text-sm text-gray-400 mt-4">🛡️ 100 יום אחריות להחזרת כסף · ✅ Apple MFI מאושר</p>
        </section>

      </main>
      <Footer />
    </div>
  )
}
