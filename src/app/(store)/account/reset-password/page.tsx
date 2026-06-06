'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [done, setDone]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    if (password.length < 8)  { setError('הסיסמה חייבת להכיל לפחות 8 תווים'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/account/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה, נסה שוב'); return }
      setDone(true)
      setTimeout(() => router.push('/account/login'), 2500)
    } catch {
      setError('שגיאת רשת, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600">קישור לא תקין. בקש קישור חדש.</p>
        <Link href="/account/forgot-password" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
          איפוס סיסמה →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">בחר סיסמה חדשה</h1>
          <p className="text-sm text-gray-500 mt-2">הסיסמה חייבת להכיל לפחות 8 תווים</p>
        </div>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-green-800">הסיסמה עודכנה בהצלחה!</p>
            <p className="text-sm text-green-700 mt-1">מועבר לדף ההתחברות...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                dir="ltr"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="לפחות 8 תווים"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                dir="ltr"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="הכנס שוב את הסיסמה"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'מעדכן...' : 'עדכן סיסמה'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
