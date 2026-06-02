'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type WizardStep = 'intro' | 'measurement' | 'test' | 'done'

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function GA4SetupWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<WizardStep>('intro')
  const [measurementId, setMeasurementId] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<null | { success: boolean; message: string }>(null)

  async function save() {
    if (!measurementId.trim()) { setError('יש להזין Measurement ID'); return }
    if (!/^G-/.test(measurementId.trim())) { setError('Measurement ID חייב להתחיל ב-G-'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/integrations/ga4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurementId: measurementId.trim(), ...(apiSecret ? { apiSecret } : {}) }),
      })
      if (!res.ok) throw new Error()
      setStep('test')
    } catch {
      setError('שגיאה בשמירה, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  async function testConnection() {
    setLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/integrations/ga4', { method: 'GET' })
      const d = await res.json()
      if (d.configured && d.config?.measurementId) {
        setTestResult({ success: true, message: `✓ Google Analytics מוגדר עם ${d.config.measurementId}` })
        setTimeout(() => setStep('done'), 1500)
      } else {
        setTestResult({ success: false, message: 'לא ניתן לאמת את ההגדרות' })
      }
    } catch {
      setTestResult({ success: false, message: 'שגיאה בבדיקה' })
    } finally {
      setLoading(false)
    }
  }

  if (step === 'intro') {
    return (
      <div className="space-y-5">
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-amber-400">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">חיבור Google Analytics 4</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            GA4 עוקב אחרי מבקרים, המרות ומשפכי מכירה באתר שלך.
            ההגדרה לוקחת פחות מ-3 דקות.
          </p>
        </div>

        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3.5">מה תקבל</p>
          <div className="space-y-2.5">
            {[
              'מעקב אוטומטי אחרי כל המבקרים',
              'נתוני המרות ורכישות בזמן אמת',
              'ניתוח מקורות תנועה (מה עובד)',
              'משפכי מכירה ונקודות נטישה',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <span className="text-[13px] text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setStep('measurement')}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors">
          בואו נתחיל →
        </button>
      </div>
    )
  }

  if (step === 'measurement') {
    return (
      <div className="space-y-4">
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">שלב 1 מתוך 2 — מזהה האתר</p>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
            <p className="text-[12px] font-semibold text-amber-400 mb-2">איך מוצאים את ה-Measurement ID?</p>
            <ol className="text-[11px] text-gray-400 space-y-1 list-decimal list-inside leading-relaxed">
              <li>היכנס ל-analytics.google.com</li>
              <li>לחץ על שם הנכס שלך (ימין למעלה)</li>
              <li>לך ל-Admin → Data Streams</li>
              <li>לחץ על ה-Web Stream של האתר שלך</li>
              <li>העתק את ה-Measurement ID (מתחיל ב-G-)</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-400 mb-1.5">
                Measurement ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={measurementId}
                onChange={e => { setMeasurementId(e.target.value); setError('') }}
                placeholder="G-XXXXXXXXXX"
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 font-mono transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">מזהה ייחודי לאתר שלך. מופיע ב-Admin → Data Streams</p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-400 mb-1.5">
                API Secret (אופציונלי)
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                placeholder="רלוונטי רק לאירועי שרת"
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">
                מאפשר שליחת אירועים מהשרת. נמצא ב-Data Streams → Measurement Protocol API secrets
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <p className="text-red-400 text-[12px]">{error}</p>
            </div>
          )}
        </div>

        <button onClick={save} disabled={loading || !measurementId.trim()}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              שומר...
            </span>
          ) : 'שמור והמשך →'}
        </button>
      </div>
    )
  }

  if (step === 'test') {
    return (
      <div className="space-y-4">
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">שלב 2 מתוך 2 — אימות</p>

          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-amber-400">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">בדוק שההגדרות נשמרו</p>
            <p className="text-gray-500 text-[12px]">לחץ לאמת שה-Measurement ID שמור במערכת</p>
          </div>

          {testResult && (
            <div className={`mt-3 rounded-xl px-4 py-3 text-center ${
              testResult.success
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              <p className="text-[13px] font-semibold">{testResult.message}</p>
            </div>
          )}
        </div>

        <button onClick={testConnection} disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              בודק...
            </span>
          ) : 'אמת הגדרות'}
        </button>
      </div>
    )
  }

  // Done
  return (
    <div className="bg-[#0E1629] border border-emerald-500/20 rounded-2xl p-8 text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
        <CheckIcon className="w-7 h-7 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Google Analytics מחובר!</h2>
        <p className="text-gray-400 text-sm">המערכת תתחיל לאסוף נתונים. בדרך כלל לוקח 24-48 שעות עד שהנתונים מופיעים ב-GA4.</p>
      </div>
      <button onClick={onDone}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors">
        לחיבורים →
      </button>
    </div>
  )
}

function GA4Dashboard({ measurementId }: { measurementId: string }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
        <div className="max-w-lg mx-auto">
          <button onClick={() => setEditing(false)} className="text-[12px] text-gray-500 hover:text-gray-300 mb-5 flex items-center gap-1.5">
            → חזור לסטטוס
          </button>
          <GA4SetupWizard onDone={() => setEditing(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-400">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Google Analytics 4</h1>
            <p className="text-[12px] text-gray-500 mt-0.5">מחובר ופעיל</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium border px-2.5 py-1 rounded-full bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          מחובר
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4">
          <p className="text-[11px] text-gray-500 mb-1">Measurement ID</p>
          <p className="text-lg font-bold text-white font-mono">{measurementId}</p>
        </div>
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4">
          <p className="text-[11px] text-gray-500 mb-1">מצב</p>
          <p className="text-sm font-semibold text-emerald-400">אוסף נתונים</p>
          <p className="text-[10px] text-gray-600 mt-0.5">נתונים מופיעים ב-GA4 תוך 24-48 שעות</p>
        </div>
      </div>

      <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5 mb-4">
        <p className="text-[12px] font-semibold text-gray-400 mb-3">הצעדים הבאים</p>
        <div className="space-y-2.5">
          {[
            { title: 'הגדר יעדי המרה', sub: 'GA4 → Configure → Events → Mark as conversion', link: 'https://analytics.google.com' },
            { title: 'הפעל דוחות E-Commerce', sub: 'GA4 → Configure → Enable Enhanced Measurement', link: 'https://analytics.google.com' },
            { title: 'חבר ל-Google Ads', sub: 'יאפשר מעקב המרות מקמפיינים', link: 'https://analytics.google.com' },
          ].map(item => (
            <div key={item.title} className="flex items-start justify-between gap-3 p-3 bg-[#070B14] rounded-xl border border-white/[0.04]">
              <div>
                <p className="text-[12px] font-medium text-white">{item.title}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setEditing(true)}
          className="flex-1 bg-[#0E1629] border border-white/[0.055] text-gray-400 text-sm font-medium py-2.5 rounded-xl hover:bg-white/[0.07] transition-colors">
          ערוך הגדרות
        </button>
        <Link href="/admin/connections"
          className="flex-1 bg-[#0E1629] border border-white/[0.055] text-gray-400 text-sm font-medium py-2.5 rounded-xl hover:bg-white/[0.07] transition-colors text-center">
          ← חיבורים
        </Link>
      </div>
    </div>
  )
}

export default function GA4Page() {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [measurementId, setMeasurementId] = useState('')

  useEffect(() => {
    fetch('/api/admin/integrations/ga4')
      .then(r => r.json())
      .then(d => {
        setConfigured(d.configured)
        setMeasurementId(d.config?.measurementId || '')
      })
      .catch(() => setConfigured(false))
  }, [])

  if (configured === null) {
    return (
      <div className="p-7 bg-[#070B14] min-h-screen flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (configured && measurementId) {
    return <GA4Dashboard measurementId={measurementId} />
  }

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 mb-6">
          <Link href="/admin/connections" className="text-[12px] text-gray-500 hover:text-gray-300 transition-colors">
            חיבורים
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-[12px] text-gray-400">Google Analytics</span>
        </div>
        <GA4SetupWizard onDone={() => {
          setConfigured(true)
          fetch('/api/admin/integrations/ga4').then(r => r.json()).then(d => setMeasurementId(d.config?.measurementId || ''))
        }} />
      </div>
    </div>
  )
}
