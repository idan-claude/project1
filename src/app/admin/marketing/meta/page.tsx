'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

/* ─── types ─────────────────────────────────────────────────────── */
interface MetaDiagnostics {
  pixelId: string
  capiConfigured: boolean
  testMode: boolean
  stats: {
    totalPaidOrders7d: number
    metaCapiFired7d: number
    capiDeliveryRate: number | null
    dedupRate: number | null
    capiFailedOrders: number
  }
  attributionBreakdown: Array<{ source: string; orders: number; revenue: number }>
  checks: Array<{ id: string; name: string; status: 'ok' | 'warning' | 'error' | 'info'; detail: string }>
  overallStatus: 'ok' | 'warning' | 'error'
}

type WizardStep = 'intro' | 'pixel' | 'capi' | 'test' | 'done'

/* ─── icons ──────────────────────────────────────────────────────── */
type P = { className?: string }
function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>{children}</svg>
}
const ICheck = (p: P) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>
const IZap   = (p: P) => <Svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Svg>

/* ─── wizard component ───────────────────────────────────────────── */
function MetaSetupWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<WizardStep>('intro')
  const [pixelId, setPixelId] = useState('')
  const [capiToken, setCapiToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [error, setError] = useState('')

  async function savePixel() {
    if (!pixelId.trim()) { setError('נא להזין Pixel ID'); return }
    setSaving(true); setError('')
    const r = await fetch('/api/admin/integrations/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pixelId }),
    })
    setSaving(false)
    if (r.ok) setStep('capi')
    else setError('שגיאה בשמירה — נסה שוב')
  }

  async function saveCapi() {
    setSaving(true); setError('')
    const r = await fetch('/api/admin/integrations/meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pixelId, capiToken }),
    })
    setSaving(false)
    if (r.ok) setStep('test')
    else setError('שגיאה בשמירה — נסה שוב')
  }

  async function runTest() {
    setTesting(true); setTestResult(null)
    try {
      const r = await fetch('/api/admin/integrations/meta/test', { method: 'POST' })
      const d = await r.json()
      setTestResult({ ok: r.ok && d.ok !== false, message: d.message || (r.ok ? 'החיבור תקין' : 'שגיאה בבדיקה') })
      if (r.ok && d.ok !== false) setTimeout(() => setStep('done'), 1200)
    } catch {
      setTestResult({ ok: false, message: 'שגיאת רשת — בדוק חיבור' })
    }
    setTesting(false)
  }

  const STEPS: { id: WizardStep; label: string }[] = [
    { id: 'pixel', label: 'Pixel ID' },
    { id: 'capi', label: 'מעקב שרת' },
    { id: 'test', label: 'בדיקה' },
    { id: 'done', label: 'מחובר' },
  ]
  const stepIdx = STEPS.findIndex(s => s.id === step)

  if (step === 'intro') return (
    <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-7 max-w-lg">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-blue-400">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </div>
      <h2 className="text-lg font-bold text-white mb-2">חבר Meta לחנות שלך</h2>
      <p className="text-[13px] text-gray-400 mb-5 leading-relaxed">
        כשלקוח קונה — Meta יקבל את המידע אוטומטית ויוכל לשפר את הפרסומות שלך.
        החיבור לוקח כ-3 דקות.
      </p>
      <div className="space-y-2 mb-6">
        {['כניסה ל-Meta Business Suite (בחינם)', 'Events Manager → "הוסף מקור נתונים" → Pixel חדש', 'העתקת ה-Pixel ID', 'הגדרות עסקיות → משתמשי מערכת → קוד גישה'].map((text, i) => (
          <div key={i} className="flex items-start gap-3 text-[12px] text-gray-400">
            <span className="w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-400 flex-shrink-0 mt-0.5">{i + 1}</span>
            {text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-300 text-[12px] font-medium rounded-xl hover:bg-white/[0.07] transition-colors">
          פתח Meta ↗
        </a>
        <button onClick={() => setStep('pixel')}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors">
          <IZap className="w-3.5 h-3.5" />
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
            <div className={`flex items-center gap-1.5`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                stepIdx > i ? 'bg-emerald-500 text-white' :
                stepIdx === i ? 'bg-blue-500 text-white ring-2 ring-blue-500/30' :
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
              <p className="text-[11px] text-gray-500 mb-4">מספר של 15-16 ספרות מ-Events Manager</p>
              <input
                type="text"
                value={pixelId}
                onChange={e => { setPixelId(e.target.value); setError('') }}
                placeholder="לדוגמה: 123456789012345"
                autoFocus
                dir="ltr"
                onKeyDown={e => e.key === 'Enter' && savePixel()}
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 font-mono"
              />
              {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('intro')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">חזור</button>
              <button onClick={savePixel} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {saving ? 'שומר...' : 'שמור והמשך'}
              </button>
            </div>
          </div>
        )}

        {step === 'capi' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">מעקב שרת (מומלץ)</h3>
              <p className="text-[11px] text-gray-500 mb-1">מאפשר מעקב גם כשיש Ad Blocker. נמצא ב:</p>
              <p className="text-[11px] text-blue-400 mb-4">הגדרות עסקיות → משתמשי מערכת → צור קוד גישה</p>
              <input
                type="password"
                value={capiToken}
                onChange={e => setCapiToken(e.target.value)}
                placeholder="קוד גישה לשרת (אופציונלי)"
                dir="ltr"
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
              />
              {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('pixel')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">חזור</button>
              <button onClick={() => setStep('test')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-300 text-sm font-medium rounded-xl hover:bg-white/[0.07]">דלג</button>
              <button onClick={saveCapi} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {saving ? 'שומר...' : 'שמור והמשך'}
              </button>
            </div>
          </div>
        )}

        {step === 'test' && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <IZap className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">בדוק את החיבור</h3>
              <p className="text-[11px] text-gray-500">נשלח אירוע בדיקה ל-Meta</p>
            </div>
            {testResult && (
              <div className={`px-3 py-2.5 rounded-xl text-[12px] font-medium ${testResult.ok ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {testResult.message}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep('done')} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">דלג</button>
              <button onClick={runTest} disabled={testing}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {testing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> בודק...</> : 'שלח אירוע בדיקה'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <ICheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Meta מחובר בהצלחה!</h3>
              <p className="text-[12px] text-gray-500">מעכשיו כל מכירה מדווחת אוטומטית ל-Meta</p>
            </div>
            <button onClick={onDone}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              צפה בסטטיסטיקות
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── main page ──────────────────────────────────────────────────── */
export default function MetaDiagnosticsPage() {
  const [data, setData] = useState<MetaDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  function load() {
    setLoading(true)
    fetch('/api/admin/marketing/meta')
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

  const isConnected = data?.pixelId && data?.capiConfigured

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-7">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-400">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--ds-text-1)]">Meta Ads — מעקב מכירות</h1>
              <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                isConnected ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-amber-400/10 border-amber-400/20 text-amber-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isConnected ? 'מחובר ופעיל' : 'לא מחובר'}
              </span>
            </div>
            <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">כל מכירה מדווחת אוטומטית ל-Meta לשיפור הקמפיינים</p>
          </div>
        </div>
        {isConnected && !showSetup && (
          <button onClick={() => setShowSetup(true)}
            className="text-[11px] text-gray-500 hover:text-gray-300 border border-white/[0.055] px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
            ערוך הגדרות
          </button>
        )}
      </div>

      {/* Wizard — shown when not connected OR when editing */}
      {(!isConnected || showSetup) && (
        <div className="mb-6">
          <MetaSetupWizard onDone={() => { setShowSetup(false); load() }} />
        </div>
      )}

      {/* Diagnostic view — shown only when connected */}
      {isConnected && !showSetup && data && (
        <>
          {/* Status cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'פיקסל', ok: !!data.pixelId, value: data.pixelId ? 'מוגדר' : 'לא מוגדר', sub: data.pixelId },
              { label: 'מעקב שרת', ok: data.capiConfigured, value: data.capiConfigured ? 'פעיל' : 'לא מוגדר', sub: 'מעקב גם ללא Ad Blocker' },
              ...(data.capiConfigured && data.stats.capiDeliveryRate !== null ? [{
                label: 'אחוז הצלחה',
                ok: data.stats.capiDeliveryRate >= 90,
                value: `${data.stats.capiDeliveryRate}%`,
                sub: 'מהמכירות הגיעו ל-Meta'
              }] : []),
            ].map((card, i) => (
              <div key={i} className={`bg-[#0E1629] border rounded-2xl p-4 ${card.ok ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
                <p className="text-[10px] text-[var(--ds-text-3)] font-medium uppercase tracking-wide mb-2">{card.label}</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${card.ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <p className={`text-sm font-bold ${card.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{card.value}</p>
                </div>
                {card.sub && <p className="text-[10px] text-[var(--ds-text-3)] font-mono mt-1 truncate">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Checks */}
          {data.checks.length > 0 && (
            <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden mb-5">
              <div className="px-5 py-3.5 border-b border-white/[0.055]">
                <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">בדיקות חיבור</p>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {data.checks.map(c => {
                  const colors = { ok: 'text-emerald-400', warning: 'text-amber-400', error: 'text-red-400', info: 'text-blue-400' }
                  const bg = { ok: 'bg-emerald-400/10 border-emerald-400/20', warning: 'bg-amber-400/10 border-amber-400/20', error: 'bg-red-400/10 border-red-400/20', info: 'bg-blue-400/10 border-blue-400/20' }
                  return (
                    <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors[c.status].replace('text-', 'bg-')}`} />
                        <span className="text-[13px] text-[var(--ds-text-1)]">{c.name}</span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${bg[c.status]} ${colors[c.status]}`}>{c.detail}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          {data.capiConfigured && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
                <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">7 ימים אחרונים</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'מכירות שאושרו', value: data.stats.totalPaidOrders7d.toString() },
                    { label: 'דווחו ל-Meta', value: data.stats.metaCapiFired7d.toString() },
                    { label: 'כפילויות הוסרו', value: data.stats.dedupRate !== null ? `${data.stats.dedupRate}%` : '—' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-[12px] text-[var(--ds-text-2)]">{row.label}</span>
                      <span className="text-[12px] font-bold text-[var(--ds-text-1)] num">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {data.attributionBreakdown.length > 0 && (
                <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
                  <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">מכירות לפי מקור</p>
                  <div className="space-y-2.5">
                    {data.attributionBreakdown.map(a => (
                      <div key={a.source} className="flex justify-between items-center">
                        <span className="text-[12px] text-[var(--ds-text-2)]">{a.source || 'כניסה ישירה'}</span>
                        <div className="flex gap-3 items-center">
                          <span className="text-[11px] text-[var(--ds-text-3)] num">{a.orders} הזמנות</span>
                          <span className="text-[12px] font-bold text-[var(--ds-text-1)] num">₪{Math.round(a.revenue / 100).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
