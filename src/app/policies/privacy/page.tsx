import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 text-white py-14 px-4 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-3xl font-extrabold mb-2">מדיניות פרטיות</h1>
          <p className="text-blue-100">עודכן לאחרונה: מאי 2026</p>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-sm text-gray-700 leading-relaxed">

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-blue-800 font-medium">
              FindCard מכבד את פרטיותך. מסמך זה מסביר אילו מידע אנחנו אוספים, כיצד אנחנו משתמשים בו, ומה הזכויות שלך.
            </p>
          </div>

          {[
            {
              title: '1. מידע שאנחנו אוספים',
              content: (
                <div className="space-y-2">
                  <p><strong>מידע שתספק לנו:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>שם מלא, כתובת אימייל, מספר טלפון</li>
                    <li>כתובת למשלוח</li>
                    <li>פרטי תשלום (מועברים ישירות לספק התשלומים — אנחנו לא שומרים)</li>
                    <li>הודעות שתשלח דרך טופס יצירת הקשר</li>
                  </ul>
                  <p className="mt-2"><strong>מידע שנאסף אוטומטית:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>כתובת IP, סוג דפדפן, מכשיר</li>
                    <li>דפים שנצפו, זמן ביקור</li>
                    <li>קובצי Cookie</li>
                  </ul>
                </div>
              ),
            },
            {
              title: '2. כיצד אנחנו משתמשים במידע',
              content: (
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>עיבוד הזמנות ומשלוחים</li>
                  <li>שליחת עדכוני הזמנה ומספרי מעקב</li>
                  <li>מתן שירות לקוחות</li>
                  <li>שליחת ניוזלטר (בהסכמתך בלבד)</li>
                  <li>שיפור האתר וחוויית המשתמש</li>
                  <li>עמידה בדרישות חוקיות</li>
                </ul>
              ),
            },
            {
              title: '3. שיתוף מידע עם צדדים שלישיים',
              content: (
                <div className="space-y-2">
                  <p>אנחנו <strong>לא</strong> מוכרים או משכירים את המידע שלך. נשתף מידע רק עם:</p>
                  <ul className="list-disc list-inside space-y-1 mr-4">
                    <li>ספקי תשלום (Cardcom/Tranzila) — לצורך עיבוד עסקאות</li>
                    <li>חברות משלוח — לצורך שליחת ההזמנה</li>
                    <li>ספקי ניתוח נתונים — כגון Google Analytics (ממוין)</li>
                    <li>רשויות חוק — אם נדרש על פי חוק</li>
                  </ul>
                </div>
              ),
            },
            {
              title: '4. אבטחת מידע',
              content: (
                <p>אנחנו משתמשים בהצפנת SSL, שרתים מאובטחים, וגישה מוגבלת למידע. פרטי כרטיסי אשראי עוברים ישירות לספק התשלומים ולא נשמרים אצלנו.</p>
              ),
            },
            {
              title: '5. קובצי Cookie',
              content: (
                <p>האתר משתמש בקובצי Cookie לשמירת הסל, ניתוח תנועה, ושיפור החוויה. ניתן לכבות Cookie בדפדפן, אם כי חלק מפונקציות האתר עשויות להיפגע.</p>
              ),
            },
            {
              title: '6. הזכויות שלך',
              content: (
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li><strong>גישה:</strong> לדעת אילו מידע שמור עליך</li>
                  <li><strong>תיקון:</strong> לתקן מידע שגוי</li>
                  <li><strong>מחיקה:</strong> לבקש מחיקת המידע שלך</li>
                  <li><strong>הסרה מרשימת תפוצה:</strong> בכל עת דרך קישור ה-Unsubscribe</li>
                </ul>
              ),
            },
            {
              title: '7. שינויים במדיניות',
              content: (
                <p>אנחנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר ויישלחו למייל הרשום. המשך השימוש באתר לאחר השינוי מהווה הסכמה.</p>
              ),
            },
            {
              title: '8. יצירת קשר בנושא פרטיות',
              content: (
                <p>
                  לכל שאלה בנושא פרטיות: <a href="mailto:findcardsupport@gmail.com" className="text-blue-600 hover:underline">findcardsupport@gmail.com</a> או{' '}
                  <a href="tel:+9720525884463" className="text-blue-600 hover:underline">+972-052-588-4463</a>
                </p>
              ),
            },
          ].map(({ title, content }) => (
            <div key={title} className="bg-white rounded-2xl border shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-900 mb-3">{title}</h2>
              {content}
            </div>
          ))}

          <div className="text-center">
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
