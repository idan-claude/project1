'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm]   = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים')
      return
    }

    setLoading(true)
    const res = await fetch('/api/account/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'שגיאה בהרשמה')
      return
    }

    // Auto sign-in after registration
    await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })
    router.push('/account')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">הרשמה</h1>
          <p className="text-sm text-gray-500 mt-2">צור חשבון לניהול הזמנות ומשלוחים</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ישראל ישראלי"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              dir="ltr"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
            <input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              dir="ltr"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="לפחות 8 תווים"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              טלפון <span className="text-gray-400 font-normal">(אופציונלי)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              dir="ltr"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="050-000-0000"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'נרשם...' : 'הרשמה'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          כבר יש לך חשבון?{' '}
          <Link href="/account/login" className="text-blue-600 font-medium hover:underline">
            כניסה
          </Link>
        </p>
      </div>
    </div>
  )
}
