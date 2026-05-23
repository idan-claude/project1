'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

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
      setError(data.error || 'פרטי התחברות שגויים')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">TrackIt Admin</h1>
          <p className="text-gray-500 text-sm mt-1">כניסה לממשק הניהול</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="אימייל" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <Input label="סיסמה" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">כניסה</Button>
        </form>
      </div>
    </div>
  )
}
