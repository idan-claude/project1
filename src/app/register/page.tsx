'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BUSINESS_TYPES = [
  { id: 'fashion',     label: 'אופנה וביגוד',       emoji: '👗' },
  { id: 'electronics', label: 'אלקטרוניקה',          emoji: '💻' },
  { id: 'beauty',      label: 'יופי וטיפוח',        emoji: '💄' },
  { id: 'food',        label: 'מזון ומשקאות',       emoji: '🍕' },
  { id: 'home',        label: 'בית וגינה',          emoji: '🏡' },
  { id: 'sports',      label: 'ספורט ופנאי',        emoji: '⚽' },
  { id: 'kids',        label: 'צעצועים וילדים',     emoji: '🧸' },
  { id: 'jewelry',     label: 'תכשיטים ואביזרים',  emoji: '💍' },
  { id: 'health',      label: 'בריאות ורווחה',      emoji: '💊' },
  { id: 'other',       label: 'אחר',                emoji: '📦' },
]

const STEPS = ['חשבון', 'שם החנות', 'קטגוריה', 'יצירה']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    businessType: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }))
    setError('')
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.name.trim()) return 'נא להזין שם מלא'
      if (!form.email.trim() || !form.email.includes('@')) return 'נא להזין כתובת מייל תקינה'
      if (form.password.length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים'
      if (form.password !== form.confirmPassword) return 'הסיסמאות אינן תואמות'
    }
    if (step === 1) {
      if (!form.storeName.trim()) return 'נא להזין שם לחנות'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setStep(s => s + 1)
  }

  async function submit() {
    if (!form.businessType) { setError('נא לבחור קטגוריה'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          storeName: form.storeName,
          businessType: form.businessType,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'שגיאה בהרשמה'); setLoading(false); return }
      router.push('/admin/onboarding')
    } catch {
      setError('שגיאת רשת, נסה שוב')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-lg font-black tracking-tight mx-auto mb-4 shadow-lg shadow-blue-500/20">
          S
        </div>
        <h1 className="text-2xl font-bold text-white">פתח חנות חינם</h1>
        <p className="text-gray-500 text-sm mt-1">הצטרף לאלפי בעלי עסקים שמוכרים עם הפלטפורמה שלנו</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-7">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 ${i < STEPS.length - 1 ? '' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                step > i ? 'bg-emerald-500 text-white' : step === i ? 'bg-blue-500 text-white ring-2 ring-blue-500/30' : 'bg-white/[0.06] text-gray-600'
              }`}>
                {step > i ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${step === i ? 'text-white' : 'text-gray-600'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px rounded-full mx-0.5 ${step > i ? 'bg-emerald-500/50' : 'bg-white/[0.06]'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6">

          {/* Step 0 — Account */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">פרטי חשבון</p>
              {[
                { key: 'name',            label: 'שם מלא',         type: 'text',     placeholder: 'ישראל ישראלי' },
                { key: 'email',           label: 'כתובת מייל',     type: 'email',    placeholder: 'your@email.com' },
                { key: 'password',        label: 'סיסמה',           type: 'password', placeholder: '8 תווים לפחות' },
                { key: 'confirmPassword', label: 'אימות סיסמה',    type: 'password', placeholder: 'הזן שוב' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[12px] font-medium text-gray-400 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    onKeyDown={e => e.key === 'Enter' && step < 2 && next()}
                    className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Store name */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">שם החנות</p>
              <div>
                <label className="block text-[12px] font-medium text-gray-400 mb-1.5">איך קוראים לחנות שלך?</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={e => set('storeName', e.target.value)}
                  placeholder="לדוגמה: מותג ישראלי, חנות האופנה שלי"
                  onKeyDown={e => e.key === 'Enter' && next()}
                  autoFocus
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                />
                <p className="text-[10px] text-gray-600 mt-1.5">ניתן לשנות מאוחר יותר מהגדרות החנות</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/15 rounded-xl p-3 mt-2">
                <p className="text-[11px] text-blue-300">💡 שם טוב לחנות: קצר, קל לזכור, ומייצג את המוצרים שלך</p>
              </div>
            </div>
          )}

          {/* Step 2 — Business type */}
          {step === 2 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">מה אתה מוכר?</p>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => set('businessType', type.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-right transition-all border ${
                      form.businessType === type.id
                        ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                        : 'bg-white/[0.03] border-white/[0.055] text-gray-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className="text-base">{type.emoji}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Creating */}
          {step === 3 && (
            <div className="text-center py-4">
              {loading ? (
                <div className="space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-white font-semibold">יוצר את החנות שלך...</p>
                  <p className="text-gray-500 text-sm">זה ייקח כמה שניות</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#070B14] border border-white/[0.055] rounded-xl p-4 space-y-2.5">
                    {[
                      { label: 'שם', value: form.name },
                      { label: 'מייל', value: form.email },
                      { label: 'שם החנות', value: form.storeName },
                      { label: 'קטגוריה', value: BUSINESS_TYPES.find(t => t.id === form.businessType)?.label || '' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="text-white font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-600">
                    בלחיצה על &quot;צור חנות&quot; אתה מסכים לתנאי השימוש
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mt-4">
              <p className="text-red-400 text-[12px] text-center">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            {step > 0 && !loading && (
              <button
                type="button"
                onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.055] text-gray-400 font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                חזור
              </button>
            )}
            {!loading && (
              <button
                type="button"
                onClick={step < 2 ? next : step === 2 ? () => { const err = validateStep(); if (!form.businessType) { setError('נא לבחור קטגוריה'); return } setStep(3) } : submit}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {step < 3 ? 'המשך' : 'צור חנות'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[12px] text-gray-600 mt-5">
          יש לך חשבון?{' '}
          <Link href="/admin/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            כניסה
          </Link>
        </p>
      </div>
    </div>
  )
}
