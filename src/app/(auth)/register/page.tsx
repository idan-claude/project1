'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'שגיאה בהרשמה')
      setLoading(false)
      return
    }

    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    router.push('/account')
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">יצירת חשבון</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="שם מלא" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <Input label="אימייל" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        <Input label="טלפון" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="05X-XXXXXXX" />
        <Input label="סיסמה" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <Button type="submit" loading={loading} className="w-full" size="lg">הרשמה</Button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        יש לך חשבון?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">כניסה</Link>
      </p>
    </>
  )
}
