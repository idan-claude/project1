'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'

const PRODUCT_SLUG = 'kartis-maakav-smart-pro'
const SELLING_PRICE = 19990  // ₪199.90
const COMPARE_PRICE = 29900  // ₪299

const FEATURE_SLIDES = [
  {
    icon: '📡',
    color: 'from-blue-600 to-indigo-700',
    label: 'Apple Find My',
    title: 'רשת מעקב עולמית — Apple Find My',
    desc: 'הכרטיס פועל על רשת ה-Find My של Apple — מאות מיליוני אייפונים שעובדים ביחד. כל אחד שעובר ליד הכרטיס מעדכן את המיקום שלו בשקט. פותחים Find My ורואים בדיוק איפה.',
    stat: '500 מיליון+ מכשירי Apple ברשת',
    statIcon: '🌐',
  },
  {
    icon: '🔋',
    color: 'from-emerald-600 to-teal-700',
    label: '8 חודשי סוללה',
    title: 'סוללה לשמונה חודשים — לא תחשוב עליה',
    desc: 'מניחים על משטח Qi פעם בשמונה חודשים ושעתיים אחרי — מלא. לא מחליפים סוללה לעולם, לא קונים CR2032, לא שום דבר.',
    stat: 'עד 8 חודשים בין טעינה לטעינה',
    statIcon: '⚡',
  },
  {
    icon: '💳',
    color: 'from-violet-600 to-purple-700',
    label: 'דק — נכנס לכל מקום',
    title: 'דק במיוחד — נכנס לכל ארנק, תיק ומחזיק מפתחות',
    desc: '1.8 מ"מ ו-7 גרם. לא תרגיש אותו בארנק, לא בתיק, לא בכיס. הוא פשוט שם — ואתה רק פותח את הטלפון כשצריך למצוא.',
    stat: 'עובי 1.8 מ"מ בלבד · נכנס לכל ארנק',
    statIcon: '✦',
  },
  {
    icon: '🌊',
    color: 'from-cyan-600 to-blue-700',
    label: 'עמידות IP67',
    title: 'עמיד בגשם, שלג ולחות — דירוג IP67',
    desc: 'הכרטיס מוגן בדירוג IP67 — שוקע מטר עומק ל-30 דקות ולא קורה לו כלום. נפל לשירותים? נכנס לכביסה בטעות? יצא ממנה עובד. גשם, שלג — לא מוסיף לחץ.',
    stat: 'עמיד מים IP67 · עד 1 מטר / 30 דקות',
    statIcon: '🛡️',
  },
  {
    icon: '🔊',
    color: 'from-orange-500 to-red-600',
    label: 'התראה קולית',
    title: 'התראה קולית חזקה',
    desc: 'לוחצים באפליקציה — הכרטיס מצפצף חזק. אפשר למצוא אותו מתחת לכרית, בין הכיסאות, בתוך התיק. כמה שניות וזהו.',
    stat: 'נשמע ממרחק עד 30 מטר',
    statIcon: '📢',
  },
  {
    icon: '⚡',
    color: 'from-blue-500 to-indigo-600',
    label: 'הגדרה מהירה',
    title: 'הגדרה תוך 30 שניות',
    desc: 'פותחים Find My, "הוסף מכשיר", מכניסים לארנק. זהו. בלי הורדות, בלי הרשמה, בלי סיסמאות. 30 שניות ואתה בסדר.',
    stat: '30 שניות הגדרה ראשונית',
    statIcon: '🎯',
  },
]

const REVIEWS = [
  {
    initials: 'ד', color: 'bg-blue-500', name: 'דנה כ.', location: 'תל אביב',
    stars: 5, detail: 'לקוחה 4 חודשים',
    text: 'כבר שנתיים הייתי מאבדת את הארנק שלי בבית — לפחות פעמיים בשבוע. מאז שהכנסתי את FindCard לא חיפשתי אותו ולו פעם אחת. פשוט פותחת Find My ותוך 10 שניות מוצאת. שינה לי את החיים!',
  },
  {
    initials: 'א', color: 'bg-green-500', name: 'אבי מ.', location: 'חיפה',
    stars: 5, detail: 'קנה 3 יחידות · לקוח 6 חודשים',
    text: 'קניתי שלושה — לי, לאשתי ולבן ה-14 שמאבד הכל. הבן שלי "איבד" את תיק הספרים בבית הספר ומצאנו אותו תוך דקה 😂 עשה לי שיחות טלפון של בכי שמחה',
  },
  {
    initials: 'ש', color: 'bg-purple-500', name: 'שירה ל.', location: 'ירושלים',
    stars: 5, detail: 'לקוחה 5 חודשים',
    text: 'טסתי לאמסטרדם ואיבדתי את המזוודה בפרנקפורט. ידעתי בדיוק שהיא בשדה התעופה הגרמני!! הראיתי לשירות הלקוחות את המפה ושלחו אותה אלי. הציל לי את החופשה ממש',
  },
  {
    initials: 'ת', color: 'bg-orange-500', name: 'תומר ז.', location: 'גבעתיים',
    stars: 3, detail: 'לקוח חודשיים',
    text: 'בסדר גמור, עובד כמו שאמרו. הגדרה היתה קצת מבלבלת בהתחלה אבל אחרי 5 דקות הסתדרתי. המשלוח לקח בערך שבועיים שזה קצת הרגיש הרבה. בסה"כ מרוצה אבל לא מגזים.',
  },
  {
    initials: 'מ', color: 'bg-pink-500', name: 'מרים ה.', location: 'נתניה',
    stars: 5, detail: 'קנה לאמא · לקוחה 5 חודשים',
    text: 'קניתי לאמא שלי בת ה-78 שמאבדת את הארנק כל יום. פשוט מתקשרים אליה ואנחנו מוצאים דרך הטלפון שלנו. שלום נפשי לכל המשפחה ממש!!!',
  },
  {
    initials: 'ר', color: 'bg-teal-500', name: 'רועי א.', location: 'באר שבע',
    stars: 5, detail: 'קנה 3 יחידות · לקוח 7 חודשים',
    text: 'קניתי את החבילה 3+1 ונתתי לגרלפרנד. עכשיו שניהם לא מאבדים כלום לגמרי 😂 המשלוח הגיע עם אריזה יפה מאוד. ממליץ בחום',
  },
  {
    initials: 'נ', color: 'bg-blue-600', name: 'נועה ג.', location: 'הרצליה',
    stars: 4, detail: 'לקוחה 3 חודשים',
    text: 'קיבלתי במתנה ולא הייתי בטוחה שאשתמש בזה. חודש אחרי — הארנק נפל מהתיק בקניון, Find My הראה שהוא עדין שם!! חזרתי ומצאתי. חסכתי בערך 750 שקל! הורדתי כוכב כי ההגדרה קצת בלבלה אותי',
  },
  {
    initials: 'ג', color: 'bg-gray-500', name: 'גל ש.', location: 'רמת גן',
    stars: 3, detail: 'לקוח חודש',
    text: 'עובד אבל לא הבנתי בדיוק איך להגדיר אותו לבד. יצרתי קשר עם שירות הלקוחות ועזרו לי מהר. עכשיו עובד מעולה. אולי תעשו סרטון הגדרה?',
  },
  {
    initials: 'א', color: 'bg-slate-600', name: 'אלי מ.', location: 'תל אביב',
    stars: 5, detail: 'לקוח 5 חודשים',
    text: 'הייתי בטוח שהארנק נגנב. Find My הראה שהוא ברחוב ליד הבית. שאלתי שכן — הוא נפל מהכיס בכניסה. בלי FindCard לא הייתי מוצא לעולם.',
  },
  {
    initials: 'ר', color: 'bg-rose-500', name: 'רחל כ.', location: 'פתח תקווה',
    stars: 4, detail: 'לקוחה 2 חודשים',
    text: 'מוצר טוב, הגדרה פשוטה ועובד בדיוק כמו שאמרו. הורדתי כוכב כי ציפיתי שיגיע מהר יותר, אבל בסופו של דבר הכל טוב. כבר הזמנתי אחד נוסף לחבר!',
  },
]

const FAQS = [
  { q: 'איך FindCard עובד?', a: 'FindCard משתמש בטכנולוגיית Bluetooth 5.1 ומתחבר לרשת ה-Find My של Apple. כל מכשיר iPhone בסביבה מדווח על מיקום הכרטיס לשרתי Apple — ואתה מקבל את המיקום המדויק דרך האפליקציה, ללא ידיעת הסביבה.' },
  { q: 'האם זה עובד עם אנדרואיד?', a: 'כרגע רק עם Apple — iPhone ו-iPad עם iOS 14.5 ומעלה. גרסת אנדרואיד בדרך, עוקבים.' },
  { q: 'כמה עבה הכרטיס?', a: 'בדיוק 1.8 מ"מ — אותו עובי של כרטיס אשראי. נכנס לכל תא כרטיסים, בכל ארנק, מבלי ליצור בליטה.' },
  { q: 'כמה זמן הסוללה מחזיקה?', a: 'עד 8 חודשים בשימוש יומיומי. טעינה אלחוטית (Qi) — מניחים על משטח טעינה ותוך שעתיים הסוללה מלאה. לא צריך להחליף סוללה לעולם.' },
  { q: 'מה הטווח המקסימלי?', a: 'טווח Bluetooth ישיר של עד 90 מטר. מחוץ לטווח — רשת Find My ממשיכה לעדכן את המיקום דרך כל iPhone בסביבה, כך שניתן לאתר בכל מקום בעולם.' },
  { q: 'האם הכרטיס עמיד במים?', a: 'כן! FindCard מדורג IP67 — עמיד בשקיעה במים עד עומק 1 מטר למשך 30 דקות. עמיד גם בגשם, שלג ולחות.' },
  { q: 'כמה זמן ההגדרה הראשונית?', a: 'בערך 30 שניות. פותחים Find My באייפון, לוחצים "הוסף מכשיר" ומוכנים. בלי להוריד שום דבר נוסף.' },
  { q: 'מה כוללת האחריות?', a: 'FindCard מגיע עם אחריות לכל החיים (Lifetime Warranty) על פגמי ייצור + 100 יום אחריות להחזרת כסף אם לא מרוצה מכל סיבה. תהליך ההחזר פשוט — בכפוף למדיניות ההחזרות שלנו. לפרטים ראה עמוד מדיניות החזרות.' },
]

function FeatureCarousel() {
  const [active, setActive] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setActive((a) => (a + 1) % FEATURE_SLIDES.length), 4500)
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function go(i: number) {
    setActive(i)
    resetTimer()
  }

  const f = FEATURE_SLIDES[active]

  return (
    <section id="features" className="py-16 px-4 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-10">
          למה FindCard הוא הבחירה הנכונה?
        </h2>

        {/* Main feature card */}
        <div className={`bg-gradient-to-br ${f.color} rounded-3xl p-8 md:p-12 text-white mb-6 transition-all duration-500`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-8xl md:text-9xl flex-shrink-0 animate-bounce" style={{ animationDuration: '2s' }}>
              {f.icon}
            </div>
            <div className="text-center md:text-right flex-1">
              <h3 className="text-2xl md:text-3xl font-extrabold mb-3">{f.title}</h3>
              <p className="text-white/80 text-base md:text-lg leading-relaxed mb-5">{f.desc}</p>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-bold">
                <span>{f.statIcon}</span>
                <span>{f.stat}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dot + thumbnail nav */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {FEATURE_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${
                  active === i ? 'w-8 h-3 bg-blue-600' : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 w-full">
            {FEATURE_SLIDES.map((slide, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-xl p-3 text-center transition-all border-2 ${
                  active === i
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-transparent bg-gray-50 hover:bg-gray-100'
                }`}
              >
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
                <div className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-5 border border-white/30">
                  🎉 מבצע — קנה 2, קבל 1 חינם · נגמר בקרוב!
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-5">
                  מצא את כל מה{' '}<br className="hidden md:block" /><span className="text-white">שאיבדת</span>
                </h1>
                <p className="text-blue-100 text-lg md:text-xl mb-6 max-w-lg mx-auto md:mx-0">
                  הכרטיס נכנס לארנק שלך ומאתר אותו תוך שניות. דק כמו כרטיס אשראי, עובד בכל מקום בעולם.
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-8 justify-center md:justify-start text-sm">
                  <span className="bg-white/15 rounded-full px-3 py-1 font-medium">✅ Apple MFI מאושר</span>
                  <span className="bg-white/15 rounded-full px-3 py-1 font-medium">⭐ 4.9/5 · 312 ביקורות</span>
                  <span className="bg-white/15 rounded-full px-3 py-1 font-medium">👥 2,000+ לקוחות</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link href="/product"
                    className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-lg">
                    לרכישה עכשיו ←
                  </Link>
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-lg">
                    קרא עוד
                  </button>
                </div>
                <div className="flex items-center gap-6 mt-8 text-sm text-blue-100 justify-center md:justify-start">
                  <span>🛡️ אחריות לכל החיים</span>
                  <span>🚚 משלוח חינם על כל הזמנה</span>
                </div>
              </div>
              <div className="flex-shrink-0 w-72 md:w-96">
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                  <img src="/images/product-1-hero.svg" alt="FindCard PRO" className="w-full h-auto" />
                </div>
                <p className="text-center text-blue-200 text-xs mt-3">עובי 1.8 מ"מ · עמיד מים · 8 חודשי סוללה</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURE CAROUSEL ── */}
        <FeatureCarousel />

        {/* ── PRODUCT PREVIEW ── */}
        <section className="bg-gray-50 py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
              <div className="rounded-3xl overflow-hidden shadow-xl order-2 md:order-1">
                <img src="/images/product-2-wallet.svg" alt="FindCard PRO בארנק" className="w-full h-auto" />
              </div>
              <div className="order-1 md:order-2">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">במלאי — 2,000+ לקוחות מרוצים</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-2">
                  כרטיס מעקב <span className="text-blue-600">FindCard PRO</span>
                </h2>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-black text-blue-600">₪199.90</span>
                  <span className="text-xl text-gray-400 line-through">₪299</span>
                  <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded">חסוך 33%</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'דק בדיוק 1.8 מ"מ — נכנס לכל ארנק',
                    'תואם Apple Find My — ללא מנוי חודשי',
                    'סוללה נטענת אלחוטית עד 8 חודשים',
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
          </div>
        </section>

        {/* ── SETUP STEPS ── */}
        <section className="bg-blue-600 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">הגדרה תוך 30 שניות</h2>
            <p className="text-blue-100 mb-12">ללא אפליקציות נוספות, ללא הרשמה. פשוט תכניס ותתחיל לעקוב.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: '👜', title: 'הכנס לארנק', desc: 'הכרטיס דק 1.8 מ"מ — נכנס לכל תא כרטיסים בלי להרגיש אותו' },
                { step: '02', icon: '📱', title: 'פתח Find My', desc: 'פשוט פתח את Find My של Apple — ללא הורדות, ללא הרשמה' },
                { step: '03', icon: '🎯', title: 'מצא תמיד', desc: 'ראה את מיקום הארנק שלך בזמן אמת, בכל מקום בעולם' },
              ].map(({ step, icon, title, desc }) => (
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
        <section className="bg-white py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-10">
              למה לבחור ב-FindCard?
            </h2>
            <div className="bg-white rounded-2xl border overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[340px]">
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
                    ['מאושר Apple Find My', '✅', '✅'],
                    ['טעינה אלחוטית Qi', '✅', '❌'],
                    ['ללא החלפת סוללה לעולם', '✅', '❌'],
                    ['מחיר', '₪199.90', '₪350+'],
                    ['אחריות לכל החיים', '✅', '❌'],
                    ['עמיד מים IP67', '✅', '⚠️ חלקי'],
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
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">אחריות לכל החיים — 100 יום החזר כסף</h2>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              אנחנו מאמינים במוצר הזה. לכן: אחריות לכל החיים על כל פגם ייצור, ו-100 יום להחזר כסף אם לא מרוצה — לא שואלים שאלות.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
              <span>✅ Apple MFI מאושר</span>
              <span>✅ IP67 עמיד במים</span>
              <span>✅ אחריות לכל החיים</span>
              <span>✅ משלוח חינם על כל הזמנה</span>
            </div>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-2">
            מה הלקוחות שלנו אומרים
          </h2>
          <p className="text-center text-gray-500 mb-10">⭐ 4.9 / 5 · מעל 312 ביקורות מאומתות</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map(({ initials, color, name, location, text, detail, stars }) => (
              <div key={name + location} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-full ${color} text-white font-bold text-lg flex items-center justify-center flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{location}</p>
                  </div>
                  <span className="mr-auto text-xs bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">מאומת ✓</span>
                </div>
                <div className="flex mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-lg ${i < stars ? 'text-blue-500' : 'text-gray-200'}`}>★</span>
                  ))}
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
          <p className="text-gray-500 text-lg mb-8">הזמן עכשיו וקבל משלוח חינם — מגיע תוך 7-14 ימי עסקים</p>
          <Link href="/product"
            className="inline-block bg-blue-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-blue-700 transition-colors text-xl shadow-lg">
            הזמן את FindCard ←
          </Link>
          <p className="text-sm text-gray-400 mt-4">🛡️ אחריות לכל החיים · ✅ Apple MFI מאושר · 🚚 משלוח חינם</p>
        </section>

      </main>
      <Footer />
    </div>
  )
}
