'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('קישור לא תקף')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || 'שגיאה באיפוס הסיסמה')
      } else {
        setDone(true)
        setTimeout(() => router.push('/admin/login'), 3000)
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
          <h1 className="text-2xl font-bold text-white">איפוס סיסמה</h1>
          <p className="text-gray-500 text-sm mt-1">בחר סיסמה חדשה לחשבון</p>
        </div>

        {done ? (
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-emerald-500/15 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">הסיסמה עודכנה בהצלחה!</p>
              <p className="text-gray-500 text-sm mt-1">מועבר לדף הכניסה...</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5">סיסמה חדשה</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="לפחות 8 תווים"
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5">אימות סיסמה</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="הכנס שוב"
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>

              {password && confirm && password !== confirm && (
                <p className="text-red-400 text-[11px]">הסיסמאות אינן תואמות</p>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <p className="text-red-400 text-[12px] text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token || password !== confirm || password.length < 8}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                    מאפס...
                  </span>
                ) : 'עדכן סיסמה'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
