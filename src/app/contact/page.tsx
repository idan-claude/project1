'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError('אירעה שגיאה בשליחת ההודעה. אנא נסה שוב או פנה ישירות למייל.')
      }
    } catch {
      setError('אירעה שגיאה. אנא נסה שוב.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">

        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-700 text-white py-16 px-4 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">צרו קשר</h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            יש לכם שאלה, בעיה, או פשוט רוצים לשמוע עוד? אנחנו כאן בשבילכם.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Contact info sidebar */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">פרטי התקשרות</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">מייל תמיכה</p>
                      <a href="mailto:findcardsupport@gmail.com" className="text-blue-600 hover:underline text-sm">
                        findcardsupport@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">טלפון / WhatsApp</p>
                      <a href="tel:+9720525884463" className="text-blue-600 hover:underline text-sm">
                        +972 052-588-4463
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">זמן תגובה</p>
                      <p className="text-gray-500 text-sm">מגיבים תוך 24 שעות</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h4 className="font-bold text-blue-900 mb-2 text-sm">שאלות נפוצות</h4>
                <p className="text-blue-700 text-xs leading-relaxed mb-3">
                  לפני פנייה לתמיכה, בדקו את עמוד השאלות הנפוצות — רוב השאלות מוסברות שם.
                </p>
                <Link href="/#faq" className="text-blue-600 font-bold text-sm hover:underline">
                  לעמוד השאלות הנפוצות ←
                </Link>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <h4 className="font-bold text-green-900 mb-2 text-sm">🛡️ אחריות לכל החיים</h4>
                <p className="text-green-700 text-xs leading-relaxed">
                  כל מוצר FindCard מגיע עם Lifetime Warranty על פגמי ייצור + 100 יום אחריות להחזרת כסף.
                </p>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border shadow-sm p-8">
                {sent ? (
                  <div className="text-center py-10">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">ההודעה נשלחה בהצלחה!</h3>
                    <p className="text-gray-500 mb-6">נחזור אליכם תוך 24 שעות. תודה שפנאתם אלינו!</p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      שלח הודעה נוספת
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">שם מלא *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="ישראל ישראלי"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">אימייל *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="mail@example.com"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">טלפון</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="050-0000000"
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">נושא *</label>
                        <select
                          required
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right bg-white"
                        >
                          <option value="">בחר נושא...</option>
                          <option value="order">שאלה על הזמנה</option>
                          <option value="shipping">בעיה עם משלוח</option>
                          <option value="return">החזרה / החזר כסף</option>
                          <option value="warranty">אחריות</option>
                          <option value="product">שאלה על המוצר</option>
                          <option value="other">אחר</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">הודעה *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="כתבו לנו את שאלתכם..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-right"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg disabled:opacity-60"
                    >
                      {loading ? '...שולח' : 'שלח הודעה ←'}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      על ידי שליחת הטופס אתה מסכים ל
                      <Link href="/policies/privacy" className="text-blue-600 hover:underline mx-1">מדיניות הפרטיות</Link>
                      שלנו
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
