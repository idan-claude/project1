import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 text-white py-14 px-4 text-center">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-3xl font-extrabold mb-2">מדיניות החזרות ואחריות</h1>
          <p className="text-blue-100">עודכן לאחרונה: מאי 2026</p>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🛡️</div>
            <h2 className="text-xl font-extrabold text-green-800 mb-1">אחריות לכל החיים (Lifetime Warranty)</h2>
            <p className="text-green-700 text-sm">כל מוצר FindCard מגיע עם אחריות מלאה לכל החיים על פגמי ייצור.</p>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">1. אחריות לכל החיים</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>FindCard מגיע עם <strong>Lifetime Warranty</strong> — אחריות לכל החיים על פגמי ייצור. אם המוצר מפסיק לפעול כתוצאה מפגם ייצור, נחליף אותו חינם, ללא עלות וללא שאלות.</p>
              <p><strong>מה מכוסה באחריות:</strong></p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>פגמי ייצור וחומרים</li>
                <li>תקלות חשמליות שאינן נובעות מנזק פיזי</li>
                <li>כשל בסוללה (מתחת ל-50% קיבולת מקורית)</li>
                <li>תקלות ב-Bluetooth או בתאימות ל-Find My</li>
              </ul>
              <p><strong>מה אינו מכוסה:</strong></p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>נזק פיזי כתוצאה מנפילה, לחץ, או שימוש לא נכון</li>
                <li>חיבור לנוזלים מעבר לדירוג IP67</li>
                <li>שינויים או תיקונים בלתי מורשים</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">2. מדיניות 100 יום החזר כסף</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 font-semibold text-base">✅ לא אהבת? פשוט שלח לנו מייל — נטפל בהחזר מהר ובלי בירוקרטיה.</p>
              </div>
              <p>אנחנו מאמינים ב-FindCard ומציעים <strong>100 יום אחריות להחזרת כסף מלאה</strong> — אם אינך מרוצה מכל סיבה שהיא.</p>
              <p><strong>כיצד לבקש החזר:</strong></p>
              <ol className="list-decimal list-inside space-y-2 mr-4">
                <li>פנה אלינו בתוך 100 יום מיום קבלת המוצר</li>
                <li>שלח מייל ל-<a href="mailto:findcardsupport@gmail.com" className="text-blue-600">findcardsupport@gmail.com</a> עם מספר ההזמנה וסיבת ההחזרה</li>
                <li>נשלח לך אישור וכתובת להחזרת המוצר</li>
                <li>אחוז את המוצר באריזה מתאימה ושלח אלינו</li>
                <li>לאחר קבלת המוצר בחזרה ובדיקתו — נחזיר לך את הכסף תוך 3-7 ימי עסקים</li>
              </ol>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p><strong>תנאים לביצוע ההחזר (בהתאם לחוק הגנת הצרכן):</strong></p>
                <ul className="list-disc list-inside space-y-0.5 mr-3">
                  <li>המוצר יוחזר בתוך 100 ימים מיום קבלתו</li>
                  <li>המוצר יוחזר במצבו המקורי, ללא נזק פיזי שאינו תוצאה של פגם ייצור</li>
                  <li>עלות משלוח ההחזרה חלה על הלקוח אלא אם נקבע אחרת בכתב</li>
                  <li>ההחזר הכספי יבוצע לאמצעי התשלום המקורי בלבד</li>
                  <li>FindCard שומרת לעצמה את הזכות לסרב להחזר אם המוצר הוחזר פגום כתוצאה משימוש לא נכון</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">3. תהליך האחריות</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>לתביעת אחריות:</p>
              <ol className="list-decimal list-inside space-y-2 mr-4">
                <li>פנה אלינו במייל: <a href="mailto:findcardsupport@gmail.com" className="text-blue-600">findcardsupport@gmail.com</a></li>
                <li>צרף תמונה/סרטון של הבעיה</li>
                <li>ציין את מספר ההזמנה</li>
                <li>נבדוק ונחזור אליך תוך 24 שעות עם פתרון</li>
              </ol>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">4. זיכויים וביטולים</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>ניתן לבטל הזמנה לפני שהיא יצאה לדרך ללא עלות. לאחר יציאת המשלוח — מדיניות 100 הימים תחול.</p>
              <p>זיכויים מועברים לכרטיס האשראי שבו בוצעה הרכישה תוך 3-7 ימי עסקים.</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">יש שאלות נוספות?</p>
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
