'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [devResetUrl, setDevResetUrl] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || 'שגיאה, נסה שוב')
      } else {
        setDone(true)
        if (d.resetUrl) setDevResetUrl(d.resetUrl)
      }
    } catch {
      setError('שגיאה בחיבור לשרת')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-lg font-black tracking-tight mx-auto mb-4">
            FC
          </div>
          <h1 className="text-2xl font-bold text-white">שכחתי סיסמה</h1>
          <p className="text-gray-500 text-sm mt-1">נשלח לך קישור לאיפוס</p>
        </div>

        {done ? (
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">בדוק את תיבת הדואר שלך</p>
              <p className="text-gray-500 text-sm mt-1">
                אם {email} רשום במערכת — שלחנו קישור לאיפוס סיסמה.
                הקישור תקף לשעה אחת.
              </p>
            </div>
            {devResetUrl && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 text-right">
                <p className="text-amber-400 text-[11px] font-semibold mb-1">מצב פיתוח — קישור לאיפוס:</p>
                <Link href={devResetUrl} className="text-blue-400 text-[11px] break-all hover:underline">{devResetUrl}</Link>
              </div>
            )}
            <Link href="/admin/login" className="block text-[13px] text-blue-400 hover:text-blue-300 transition-colors font-medium mt-2">
              חזור לדף הכניסה
            </Link>
          </div>
        ) : (
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5">כתובת אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-red-400 text-[12px] text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                    שולח...
                  </span>
                ) : 'שלח קישור לאיפוס'}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-[12px] text-gray-500 mt-5">
          <Link href="/admin/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            חזור לדף הכניסה
          </Link>
        </p>
      </div>
    </div>
  )
}
