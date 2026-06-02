'use client'
import { useEffect, useState } from 'react'

/* ─── types ─────────────────────────────────────────────────────── */
interface TikTokDiagnostics {
  pixelId: string
  eventsApiConfigured: boolean
  stats: {
    totalPaidOrders7d: number
    tiktokCapiFired7d: number
    tiktokPixelFired7d: number
    ttAttributed: number
    deliveryRate: number | null
  }
  checks: Array<{ id: string; name: string; status: 'ok' | 'warning' | 'error' | 'info'; detail: string }>
  overallStatus: 'ok' | 'warning' | 'error'
}

type WizardStep = 'intro' | 'pixel' | 'events' | 'test' | 'done'

/* ─── wizard ─────────────────────────────────────────────────────── */
function TikTokSetupWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<WizardStep>('intro')
  const [pixelId, setPixelId] = useState('')
  const [eventsToken, setEventsToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

  async function savePixel() {
    if (!pixelId.trim()) { setError('נא להזין Pixel ID'); return }
    setSaving(true); setError('')
    const r = await fetch('/api/admin/integrations/tiktok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pixelId }),
    })
    setSaving(false)
    if (r.ok) setStep('events')
    else setError('שגיאה בשמירה — נסה שוב')
  }

  async function saveEvents() {
    setSaving(true); setError('')
    const r = await fetch('/api/admin/integrations/tiktok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pixelId, eventsApiToken: eventsToken }),
    })
    setSaving(false)
    if (r.ok) setStep('test')
    else setError('שגיאה בשמירה — נסה שוב')
  }

  async function runTest() {
    setTesting(true); setTestResult(null)
    try {
      const r = await fetch('/api/admin/integrations/tiktok/test', { method: 'POST' })
      const d = await r.json()
      setTestResult({ ok: r.ok && d.ok !== false, message: d.message || (r.ok ? 'החיבור תקין' : 'שגיאה') })
      if (r.ok && d.ok !== false) setTimeout(() => setStep('done'), 1200)
    } catch {
      setTestResult({ ok: false, message: 'שגיאת רשת' })
    }
    setTesting(false)
  }

  const STEPS: { id: WizardStep; label: string }[] = [
    { id: 'pixel', label: 'Pixel ID' },
    { id: 'events', label: 'מעקב שרת' },
    { id: 'test', label: 'בדיקה' },
    { id: 'done', label: 'מחובר' },
  ]
  const stepIdx = STEPS.findIndex(s => s.id === step)

  if (step === 'intro') return (
    <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-7 max-w-lg">
      <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-violet-400">
          <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
      </div>
      <h2 className="text-lg font-bold text-white mb-2">חבר TikTok לחנות שלך</h2>
      <p className="text-[13px] text-gray-400 mb-5 leading-relaxed">
        כשלקוח קונה דרך TikTok — הפרסומת שלך תקבל קרדיט ותשתפר אוטומטית.
        החיבור לוקח כ-3 דקות.
      </p>
      <div className="space-y-2 mb-6">
        {['כניסה ל-TikTok Ads Manager', 'Events → Manage → הוסף Pixel חדש', 'העתק את ה-Pixel ID', 'בניהול אירועים: קוד גישה לשרת → העתק'].map((text, i) => (
          <div key={i} className="flex items-start gap-3 text-[12px] text-gray-400">
            <span className="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-[9px] font-bold text-violet-400 flex-shrink-0 mt-0.5">{i + 1}</span>
            {text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <a href="https://ads.tiktok.com" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-300 text-[12px] font-medium rounded-xl hover:bg-white/[0.07] transition-colors">
          פתח TikTok Ads ↗
        </a>
        <button onClick={() => setStep('pixel')}
          className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors">
          יש לי Pixel ID — המשך
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                stepIdx > i ? 'bg-emerald-500 text-white' :
                stepIdx === i ? 'bg-violet-500 text-white ring-2 ring-violet-500/30' :
                'bg-white/[0.06] text-gray-600'
              }`}>
                {stepIdx > i ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${stepIdx === i ? 'text-white' : 'text-gray-600'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-6 h-px rounded-full ${stepIdx > i ? 'bg-emerald-500/50' : 'bg-white/[0.06]'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6">
        {step === 'pixel' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">הזן את Pixel ID שלך</h3>
              <p className="text-[11px] text-gray-500 mb-4">מספר מ-TikTok Ads Events Manager</p>
              <input type="text" value={pixelId} onChange={e => { setPixelId(e.target.value); setError('') }}
                placeholder="לדוגמה: C89ABCDEF12345" autoFocus dir="ltr"
                onKeyDown={e => e.key === 'Enter' && savePixel()}
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 font-mono" />
              {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('intro')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">חזור</button>
              <button onClick={savePixel} disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {saving ? 'שומר...' : 'שמור והמשך'}
              </button>
            </div>
          </div>
        )}

        {step === 'events' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">מעקב שרת (מומלץ)</h3>
              <p className="text-[11px] text-gray-500 mb-1">מאפשר מעקב מדויק יותר. נמצא ב:</p>
              <p className="text-[11px] text-violet-400 mb-4">TikTok Ads Manager → ניהול אירועים → קוד גישה לשרת</p>
              <input type="password" value={eventsToken} onChange={e => setEventsToken(e.target.value)}
                placeholder="קוד גישה לשרת (אופציונלי)" dir="ltr"
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50" />
              {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('pixel')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">חזור</button>
              <button onClick={() => setStep('test')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-300 text-sm font-medium rounded-xl hover:bg-white/[0.07]">דלג</button>
              <button onClick={saveEvents} disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {saving ? 'שומר...' : 'שמור והמשך'}
              </button>
            </div>
          </div>
        )}

        {step === 'test' && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-violet-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">בדוק את החיבור</h3>
              <p className="text-[11px] text-gray-500">נשלח אירוע בדיקה ל-TikTok</p>
            </div>
            {testResult && (
              <div className={`px-3 py-2.5 rounded-xl text-[12px] font-medium ${testResult.ok ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {testResult.message}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep('done')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">דלג</button>
              <button onClick={runTest} disabled={testing}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {testing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> בודק...</> : 'שלח אירוע בדיקה'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">TikTok מחובר בהצלחה!</h3>
              <p className="text-[12px] text-gray-500">מעכשיו כל מכירה מ-TikTok מדווחת אוטומטית</p>
            </div>
            <button onClick={onDone} className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              צפה בסטטיסטיקות
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── main page ──────────────────────────────────────────────────── */
export default function TikTokDiagnosticsPage() {
  const [data, setData] = useState<TikTokDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  function load() {
    setLoading(true)
    fetch('/api/admin/marketing/tiktok')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-white/[0.04] rounded-xl" />
        <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl" />)}</div>
        <div className="h-48 bg-white/[0.04] rounded-2xl" />
      </div>
    </div>
  )

  const isConnected = data?.pixelId && data?.eventsApiConfigured

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-7">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-violet-400">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--ds-text-1)]">TikTok Ads — מעקב מכירות</h1>
              <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                isConnected ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isConnected ? 'מחובר ופעיל' : 'לא מחובר'}
              </span>
            </div>
            <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">מעקב אוטומטי של מכירות מקמפיינים ב-TikTok</p>
          </div>
        </div>
        {isConnected && !showSetup && (
          <button onClick={() => setShowSetup(true)} className="text-[11px] text-gray-500 hover:text-gray-300 border border-white/[0.055] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
            ערוך הגדרות
          </button>
        )}
      </div>

      {/* Wizard */}
      {(!isConnected || showSetup) && (
        <div className="mb-6">
          <TikTokSetupWizard onDone={() => { setShowSetup(false); load() }} />
        </div>
      )}

      {/* Diagnostic view */}
      {isConnected && !showSetup && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'פיקסל', ok: !!data.pixelId, value: data.pixelId ? 'מוגדר' : 'לא מוגדר', sub: data.pixelId },
              { label: 'מעקב שרת', ok: data.eventsApiConfigured, value: data.eventsApiConfigured ? 'פעיל' : 'לא מוגדר', sub: 'מעקב מהשרת' },
              { label: 'ייחוס 7 ימים', ok: data.stats.ttAttributed > 0, value: String(data.stats.ttAttributed), sub: 'הזמנות מ-TikTok' },
            ].map((card, i) => (
              <div key={i} className={`bg-[#0E1629] border rounded-2xl p-4 ${card.ok ? 'border-emerald-500/20' : 'border-white/[0.055]'}`}>
                <p className="text-[10px] text-[var(--ds-text-3)] font-medium uppercase tracking-wide mb-2">{card.label}</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${card.ok ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  <p className={`text-sm font-bold ${card.ok ? 'text-emerald-400' : 'text-[var(--ds-text-2)]'}`}>{card.value}</p>
                </div>
                {card.sub && <p className="text-[10px] text-[var(--ds-text-3)] font-mono mt-1 truncate">{card.sub}</p>}
              </div>
            ))}
          </div>

          {data.checks.length > 0 && (
            <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden mb-5">
              <div className="px-5 py-3.5 border-b border-white/[0.055]">
                <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">בדיקות חיבור</p>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {data.checks.map(c => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'ok' ? 'bg-emerald-400' : c.status === 'warning' ? 'bg-amber-400' : c.status === 'error' ? 'bg-red-400' : 'bg-blue-400'}`} />
                      <span className="text-[13px] text-[var(--ds-text-1)]">{c.name}</span>
                    </div>
                    <span className="text-[11px] text-[var(--ds-text-3)]">{c.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.eventsApiConfigured && (
            <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
              <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">7 ימים אחרונים</p>
              <div className="space-y-2.5">
                {[
                  { label: 'מכירות שאושרו', value: data.stats.totalPaidOrders7d.toString() },
                  { label: 'דווחו ל-TikTok', value: data.stats.tiktokCapiFired7d.toString() },
                  { label: 'אחוז הצלחה', value: data.stats.deliveryRate !== null ? `${data.stats.deliveryRate}%` : '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-[12px] text-[var(--ds-text-2)]">{row.label}</span>
                    <span className="text-[12px] font-bold text-[var(--ds-text-1)] num">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
