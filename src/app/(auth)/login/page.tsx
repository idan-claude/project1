'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (res?.error) {
      setError('אימייל או סיסמה שגויים')
      setLoading(false)
    } else {
      router.push(searchParams.get('callbackUrl') || '/account')
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">כניסה לחשבון</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="אימייל" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        <Input label="סיסמה" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <Button type="submit" loading={loading} className="w-full" size="lg">כניסה</Button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        אין לך חשבון?{' '}
        <Link href="/register" className="text-blue-600 font-medium hover:underline">הרשם כאן</Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
