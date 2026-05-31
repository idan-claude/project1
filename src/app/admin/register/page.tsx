'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BUSINESS_TYPES = [
  'אופנה וביגוד',
  'אלקטרוניקה',
  'יופי וטיפוח',
  'מזון ומשקאות',
  'בית וגינה',
  'ספורט ופנאי',
  'צעצועים וילדים',
  'תכשיטים ואביזרים',
  'אחר',
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    businessType: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function next() {
    setError('')
    if (step === 1) {
      if (!form.name || !form.email || !form.password) { setError('נא למלא את כל השדות'); return }
      if (form.password.length < 8) { setError('הסיסמה חייבת להכיל לפחות 8 תווים'); return }
    }
    if (step === 2) {
      if (!form.storeName) { setError('נא להזין שם חנות'); return }
    }
    setStep(s => s + 1)
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-lg font-black tracking-tight mx-auto mb-4">
            FC
          </div>
          <h1 className="text-2xl font-bold text-[var(--ds-text-1)]">פתח חנות חדשה</h1>
          <p className="text-[var(--ds-text-3)] text-sm mt-1">פשוט, מהיר, בחינם</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center gap-2 ${s < 3 ? 'flex-1' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                step > s ? 'bg-emerald-500 text-white' : step === s ? 'bg-blue-500 text-white' : 'bg-white/[0.06] text-[var(--ds-text-3)]'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > s ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6">
          {/* Step 1: Account details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">פרטי חשבון</p>
              </div>
              {[
                { key: 'name', label: 'שם מלא', type: 'text', placeholder: 'ישראל ישראלי' },
                { key: 'email', label: 'אימייל', type: 'email', placeholder: 'your@email.com' },
                { key: 'password', label: 'סיסמה', type: 'password', placeholder: '8 תווים לפחות' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[12px] font-medium text-[var(--ds-text-2)] mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-[var(--ds-text-1)] placeholder:text-[var(--ds-text-3)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Store name */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">פרטי החנות</p>
              <div>
                <label className="block text-[12px] font-medium text-[var(--ds-text-2)] mb-1.5">שם החנות</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={e => setForm(p => ({ ...p, storeName: e.target.value }))}
                  placeholder="החנות שלי"
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-[var(--ds-text-1)] placeholder:text-[var(--ds-text-3)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--ds-text-2)] mb-2">סוג העסק</label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, businessType: type }))}
                      className={`px-3 py-2 rounded-xl text-[12px] font-medium text-right transition-colors border ${
                        form.businessType === type
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          : 'bg-white/[0.03] border-white/[0.055] text-[var(--ds-text-2)] hover:bg-white/[0.06]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">אישור פרטים</p>
              <div className="space-y-2.5">
                {[
                  { label: 'שם', value: form.name },
                  { label: 'אימייל', value: form.email },
                  { label: 'שם החנות', value: form.storeName },
                  { label: 'סוג עסק', value: form.businessType || 'לא נבחר' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.03]">
                    <span className="text-[12px] text-[var(--ds-text-3)]">{row.label}</span>
                    <span className="text-[12px] font-medium text-[var(--ds-text-1)]">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mt-2">
                <p className="text-[12px] text-blue-300">
                  בלחיצה על "צור חנות" אתה מסכים לתנאי השימוש ולמדיניות הפרטיות.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 mt-4">
              <p className="text-red-400 text-[12px] text-center">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.055] text-[var(--ds-text-2)] font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                חזור
              </button>
            )}
            <button
              type="button"
              onClick={step < 3 ? next : submit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                  יוצר חנות...
                </span>
              ) : step < 3 ? 'המשך' : 'צור חנות'}
            </button>
          </div>
        </div>

        <p className="text-center text-[12px] text-[var(--ds-text-3)] mt-5">
          יש לך חשבון?{' '}
          <Link href="/admin/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            כניסה
          </Link>
        </p>
      </div>
    </div>
  )
}
