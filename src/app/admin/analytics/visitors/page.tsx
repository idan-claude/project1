'use client'
import { useEffect, useState } from 'react'

interface VisitorStats {
  totalToday: number
  totalWeek: number
  uniqueVisitorsToday: number
  uniqueVisitorsWeek: number
  byEvent: Record<string, number>
  byDevice: Record<string, number>
  topPages: Array<{ path: string; count: number }>
  cartEvents: number
  checkoutStarts: number
  checkoutCompletes: number
  topReferrers: Array<{ referrer: string; count: number }>
  byHour: Array<{ hour: number; count: number }>
}

export default function VisitorAnalyticsPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'today' | 'week'>('today')

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/visitors')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const convRate = stats
    ? stats.checkoutCompletes > 0 && stats.totalToday > 0
      ? ((stats.checkoutCompletes / stats.totalToday) * 100).toFixed(1)
      : '0.0'
    : null

  const cartAbandonment = stats
    ? stats.cartEvents > 0 && stats.checkoutCompletes > 0
      ? (((stats.cartEvents - stats.checkoutCompletes) / stats.cartEvents) * 100).toFixed(0)
      : stats.cartEvents > 0 ? '100' : '—'
    : null

  if (loading) return (
    <div className="p-6 min-h-screen bg-[#080C16] space-y-3">
      {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-[#0E1525] rounded-2xl animate-pulse" />)}
    </div>
  )

  if (!stats) return (
    <div className="p-6 min-h-screen bg-[#080C16] flex items-center justify-center">
      <p className="text-gray-500">שגיאה בטעינת נתונים</p>
    </div>
  )

  const totalVisitors = range === 'today' ? stats.totalToday : stats.totalWeek
  const uniqueVisitors = range === 'today' ? stats.uniqueVisitorsToday : stats.uniqueVisitorsWeek

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">מבקרים</h1>
          <p className="text-sm text-gray-500 mt-0.5">ניתוח תנועה, מקורות ומסעות לקוח בזמן אמת</p>
        </div>
        <div className="flex gap-1.5 sm:mr-auto">
          {(['today', 'week'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-500 hover:text-gray-300'}`}>
              {r === 'today' ? 'היום' : '7 ימים'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'ביקורים', value: totalVisitors.toLocaleString('he-IL'), sub: range === 'today' ? 'היום' : '7 ימים', color: 'text-white' },
          { label: 'מבקרים ייחודיים', value: uniqueVisitors.toLocaleString('he-IL'), sub: range === 'today' ? 'היום' : '7 ימים', color: 'text-blue-400' },
          { label: 'המרת עגלה', value: cartAbandonment === '—' ? '—' : `${cartAbandonment}% נטישה`, sub: `${stats.cartEvents} הוסיפו לסל`, color: cartAbandonment === '—' ? 'text-gray-500' : Number(cartAbandonment) > 70 ? 'text-red-400' : 'text-emerald-400' },
          { label: 'השלימו תשלום', value: stats.checkoutCompletes.toString(), sub: `${stats.checkoutStarts} התחילו`, color: 'text-emerald-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-white mb-1">משפך המרה</h2>
        <p className="text-xs text-gray-600 mb-5">מבקר ← עגלה ← תשלום ← רכישה</p>
        {[
          { label: 'ביקורי דף מוצר', value: stats.byEvent['product_view'] || 0, color: 'bg-blue-500' },
          { label: 'הוספה לסל', value: stats.cartEvents, color: 'bg-indigo-500' },
          { label: 'התחלת תשלום', value: stats.checkoutStarts, color: 'bg-violet-500' },
          { label: 'רכישה הושלמה', value: stats.checkoutCompletes, color: 'bg-emerald-500' },
        ].map((step, i, arr) => {
          const base = arr[0].value || 1
          const pct = Math.round((step.value / base) * 100)
          return (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{step.label}</span>
                <span className="text-white font-bold">{step.value.toLocaleString('he-IL')} <span className="text-gray-500 font-normal">({pct}%)</span></span>
              </div>
              <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${Math.max(2, pct)}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top pages */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">דפים פופולריים</h2>
          <p className="text-xs text-gray-600 mb-4">לפי מספר ביקורים</p>
          {stats.topPages.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-2">
              {stats.topPages.slice(0, 7).map((page, i) => {
                const maxCount = stats.topPages[0]?.count || 1
                const pct = Math.round((page.count / maxCount) * 100)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-4 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300 truncate">{page.path || '/'}</span>
                        <span className="text-white font-semibold mr-2">{page.count}</span>
                      </div>
                      <div className="bg-white/5 rounded-full h-1">
                        <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Device breakdown */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">מכשירים</h2>
          <p className="text-xs text-gray-600 mb-4">מובייל/דסקטופ/טאבלט</p>
          {Object.keys(stats.byDevice).length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byDevice).map(([device, count]) => {
                const total = Object.values(stats.byDevice).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const icons: Record<string, string> = { mobile: '📱', desktop: '🖥️', tablet: '📲', unknown: '❓' }
                const labels: Record<string, string> = { mobile: 'מובייל', desktop: 'דסקטופ', tablet: 'טאבלט', unknown: 'לא ידוע' }
                return (
                  <div key={device} className="flex items-center gap-3">
                    <span className="text-base">{icons[device] || '📱'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">{labels[device] || device}</span>
                        <span className="text-white font-semibold">{pct}%</span>
                      </div>
                      <div className="bg-white/5 rounded-full h-2">
                        <div className="h-full bg-indigo-500/70 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 w-6">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Referrers */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">מקורות תנועה</h2>
          <p className="text-xs text-gray-600 mb-4">מהיכן מגיעים המבקרים</p>
          {stats.topReferrers.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-2">
              {stats.topReferrers.slice(0, 6).map((ref, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-xs text-gray-400 truncate flex-1">{ref.referrer || '(ישיר)'}</span>
                  <span className="text-xs font-semibold text-white mr-3">{ref.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hourly chart */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">פעילות לפי שעה</h2>
          <p className="text-xs text-gray-600 mb-4">שעות שיא בחנות</p>
          {stats.byHour.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="flex items-end gap-0.5 h-24">
              {Array.from({ length: 24 }, (_, h) => {
                const found = stats.byHour.find(b => b.hour === h)
                const count = found?.count || 0
                const maxCount = Math.max(...stats.byHour.map(b => b.count), 1)
                const height = Math.max(4, Math.round((count / maxCount) * 80))
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-1" title={`${h}:00 — ${count} ביקורים`}>
                    <div className={`w-full rounded-sm ${count > 0 ? 'bg-blue-500/70' : 'bg-white/5'}`} style={{ height: `${height}%` }} />
                    {h % 6 === 0 && <span className="text-[8px] text-gray-700">{h}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div className="mt-5 bg-[#0E1525] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-blue-400 text-lg flex-shrink-0">ℹ</span>
        <div>
          <p className="text-xs font-semibold text-gray-300">נתונים בזמן אמת</p>
          <p className="text-xs text-gray-600 mt-0.5">הנתונים מגיעים ישירות ממסד הנתונים. IP, מכשיר ומדינה מחושבים מ-headers — ללא איסוף כתובות מדויק (עמידה ב-GDPR).</p>
        </div>
      </div>
    </div>
  )
}
