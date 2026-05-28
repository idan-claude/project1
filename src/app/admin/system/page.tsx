'use client'
import { useState } from 'react'

interface TestResult {
  id: string
  name: string
  status: 'pass' | 'fail' | 'warn' | 'info'
  detail: string
  critical: boolean
}

interface VerifyData {
  overallStatus: 'pass' | 'fail' | 'warn'
  summary: { passes: number; warnings: number; criticalFails: number; total: number; durationMs: number }
  results: TestResult[]
  checkedAt: string
}

const STATUS_CONFIG = {
  pass: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: '✓', label: 'עבר' },
  fail: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         icon: '✕', label: 'נכשל' },
  warn: { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     icon: '⚠', label: 'אזהרה' },
  info: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       icon: 'ℹ', label: 'מידע' },
}

export default function SystemVerifyPage() {
  const [data, setData]       = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [runCount, setRunCount] = useState(0)

  async function runVerify() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/system/verify')
      const d = await r.json()
      setData(d)
      setRunCount(c => c + 1)
    } finally {
      setLoading(false)
    }
  }

  const overall = data ? STATUS_CONFIG[data.overallStatus] : null

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">בדיקת מערכת</h1>
          <p className="text-sm text-gray-500 mt-0.5">אימות אוטומטי של כל רכיבי הפלטפורמה</p>
        </div>
        <button
          onClick={runVerify}
          disabled={loading}
          className="sm:mr-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
              בודק...
            </>
          ) : (
            <>▶ הפעל בדיקה{runCount > 0 ? ` (${runCount})` : ''}</>
          )}
        </button>
      </div>

      {/* Overall status */}
      {data && overall && (
        <div className={`border rounded-2xl p-5 mb-6 ${overall.bg}`}>
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-black ${overall.color}`}>{overall.icon}</span>
            <div>
              <p className={`text-lg font-bold ${overall.color}`}>
                {data.overallStatus === 'pass' ? 'כל הבדיקות עברו בהצלחה' :
                 data.overallStatus === 'warn' ? 'יש אזהרות — מערכת פועלת' :
                 'שגיאות קריטיות זוהו!'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {data.summary.passes} עברו · {data.summary.warnings} אזהרות · {data.summary.criticalFails} כשלים קריטיים
                · {data.summary.durationMs}ms
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="text-center py-20 bg-[#0E1525] border border-white/5 rounded-2xl">
          <p className="text-4xl mb-3">🔬</p>
          <p className="text-white font-semibold">מוכן לבדיקה</p>
          <p className="text-xs text-gray-600 mt-1">לחץ "הפעל בדיקה" לאימות כל רכיבי הפלטפורמה</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">{[...Array(8)].map((_,i) => <div key={i} className="h-14 bg-[#0E1525] rounded-2xl animate-pulse" />)}</div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Critical tests first */}
          {['critical', 'non-critical'].map(group => {
            const isCritical = group === 'critical'
            const groupResults = data.results.filter(r => r.critical === isCritical)
            if (groupResults.length === 0) return null
            return (
              <div key={group} className="mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">
                  {isCritical ? 'בדיקות קריטיות' : 'בדיקות נוספות'}
                </p>
                <div className="bg-[#0E1525] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {groupResults.map(r => {
                      const cfg = STATUS_CONFIG[r.status]
                      return (
                        <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`text-sm font-bold flex-shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                            <div className="min-w-0">
                              <p className="text-sm text-white font-medium">{r.name}</p>
                              <p className="text-xs text-gray-600 truncate mt-0.5">{r.detail}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          <p className="text-xs text-gray-700 text-center mt-4">
            נבדק: {new Date(data.checkedAt).toLocaleString('he-IL')}
          </p>
        </>
      )}

      {/* What's tested */}
      {!data && (
        <div className="mt-6 bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-3">מה הבדיקה בודקת?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: '🔐', name: 'PAID_FILTER Integrity', desc: 'payment.status === paid + testMode filter' },
              { icon: '📊', name: 'Behavior ≠ Purchase', desc: 'VisitorEvents לא נספרים כרכישות' },
              { icon: '🗄️', name: 'Database Connection', desc: 'MongoDB נגיש ותקין' },
              { icon: '💳', name: 'Payment Provider', desc: 'ספק תשלום מוגדר ופעיל' },
              { icon: '🚫', name: 'IP Blocking', desc: 'מערכת חסימה פעילה' },
              { icon: '📘', name: 'Meta Pixel + CAPI', desc: 'פיקסל וConverisosns API' },
              { icon: '🎵', name: 'TikTok Events API', desc: 'פיקסל ו-Events API' },
              { icon: '🧪', name: 'Test Order Isolation', desc: 'הזמנות בדיקה מופרדות' },
            ].map(t => (
              <div key={t.name} className="flex items-center gap-2.5 py-1.5">
                <span className="text-lg flex-shrink-0">{t.icon}</span>
                <div>
                  <p className="text-xs font-medium text-gray-300">{t.name}</p>
                  <p className="text-[11px] text-gray-600">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
