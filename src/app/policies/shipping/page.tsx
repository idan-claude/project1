import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 text-white py-14 px-4 text-center">
          <div className="text-5xl mb-3">🚚</div>
          <h1 className="text-3xl font-extrabold mb-2">מדיניות משלוח</h1>
          <p className="text-blue-100">עודכן לאחרונה: מאי 2026</p>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🚚</div>
            <h2 className="text-xl font-extrabold text-blue-800 mb-1">משלוח חינם על כל הזמנה</h2>
            <p className="text-blue-700 text-sm">ללא מינימום הזמנה — משלוח חינם לכל הארץ.</p>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">1. זמני משלוח</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <p className="font-bold text-gray-900 mb-1">📦 משלוח רגיל</p>
                  <p className="text-2xl font-extrabold text-blue-600">7-14</p>
                  <p className="text-gray-500 text-xs">ימי עסקים</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="font-bold text-gray-900 mb-1">⚡ משלוח מהיר</p>
                  <p className="text-2xl font-extrabold text-blue-600">6-12</p>
                  <p className="text-gray-500 text-xs">ימי עסקים</p>
                </div>
              </div>
              <p className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-orange-700">
                ⚠️ <strong>שימו לב:</strong> עקב המצב הביטחוני יתכנו עיכובים קלים. זמני המשלוח הנ"ל הם הערכות ולא מובטחים.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">2. מה קורה אחרי הרכישה?</h2>
            <div className="space-y-3">
              {[
                { step: '01', title: 'אישור הזמנה', desc: 'תקבל/י מייל אישור עם פרטי ההזמנה מיד לאחר הרכישה.' },
                { step: '02', title: 'עיבוד ושליחה', desc: 'ההזמנה מוכנה ונשלחת תוך 1-3 ימי עסקים.' },
                { step: '03', title: 'מספר מעקב', desc: 'תקבל/י מספר מעקב למייל ברגע שהחבילה יוצאת לדרך.' },
                { step: '04', title: 'קבלת החבילה', desc: 'החבילה מגיעה אל פתח ביתך תוך 7-14 ימי עסקים.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    <p className="text-gray-500 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">3. מדיניות חבילה שלא הגיעה</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>אם החבילה לא הגיעה תוך 20 ימי עסקים ממועד השליחה:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>פנה אלינו עם מספר ההזמנה</li>
                <li>נפתח חקירה עם חברת השליחות</li>
                <li>אם לא נמצאה תוך 7 ימים נוספים — נשלח מחדש או נחזיר את הכסף במלואו</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">4. משלוח לחו"ל</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              כרגע אנחנו משלחים לישראל בלבד. לשליחה לחו"ל — פנה אלינו ונבדוק אפשרויות.
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">יש שאלות על המשלוח?</p>
            <Link href="/contact" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-block">
              צרו קשר ←
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
