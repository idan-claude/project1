'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/account/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        setError(data.error || 'שגיאה, נסה שוב')
      }
    } catch {
      setError('שגיאת רשת, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">שכחת סיסמה?</h1>
          <p className="text-sm text-gray-500 mt-2">הכנס את כתובת המייל שלך ונשלח קישור לאיפוס</p>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">📧</div>
            <p className="font-semibold text-green-800 mb-1">בדוק את תיבת הדואר שלך</p>
            <p className="text-sm text-green-700">
              אם כתובת המייל <strong>{email}</strong> רשומה במערכת, תקבל קישור לאיפוס תוך כמה דקות.
            </p>
            <Link href="/account/login"
              className="mt-4 inline-block text-sm text-blue-600 font-medium hover:underline">
              חזור להתחברות →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כתובת אימייל</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                dir="ltr"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/account/login" className="text-blue-600 font-medium hover:underline">
            ← חזור להתחברות
          </Link>
        </p>
      </div>
    </div>
  )
}
