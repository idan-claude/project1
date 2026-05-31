'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'פרטי ההתחברות אינם נכונים')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-lg font-black tracking-tight mx-auto mb-4">
            FC
          </div>
          <h1 className="text-2xl font-bold text-[var(--ds-text-1)]">כניסה לחנות</h1>
          <p className="text-[var(--ds-text-3)] text-sm mt-1">ניהול העסק שלך</p>
        </div>

        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--ds-text-2)] mb-1.5">אימייל</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                placeholder="your@email.com"
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-[var(--ds-text-1)] placeholder:text-[var(--ds-text-3)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--ds-text-2)] mb-1.5">סיסמה</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-[var(--ds-text-1)] placeholder:text-[var(--ds-text-3)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
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
                  מתחבר...
                </span>
              ) : 'כניסה'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[var(--ds-text-3)] mt-5">
          אין לך חשבון עדיין?{' '}
          <Link href="/admin/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            צור חנות חדשה
          </Link>
        </p>
      </div>
    </div>
  )
}
