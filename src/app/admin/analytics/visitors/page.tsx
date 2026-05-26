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
  recentJourneys: Array<{
    _id: string
    visitorId: string
    events: Array<{ event: string; path: string; scroll: number; createdAt: string; meta: Record<string, unknown> }>
    device: string
    country: string
    city: string
    language: string
    firstSeen: string
    lastSeen: string
  }>
  scrollDepth: Array<{ path: string; avgScroll: number; count: number }>
  byCountry: Array<{ country: string; count: number }>
  bounceRate: number
  avgSessionDuration: number
  avgScrollDepth: number
  returningRate: number
  totalSessions: number
  dropoffByEvent: Array<{ event: string; count: number; pct: number }>
}

const EVENT_LABELS: Record<string, string> = {
  pageview: 'דף נצפה',
  product_view: 'צפה במוצר',
  add_to_cart: 'הוסיף לסל',
  checkout_start: 'התחיל תשלום',
  checkout_complete: 'השלים רכישה',
  scroll_depth: 'גלילה',
  rage_click: 'לחיצות כעס',
  exit_page: 'יציאה',
  custom: 'מותאם',
}

const EVENT_ICONS: Record<string, string> = {
  pageview: '👁',
  product_view: '🛍',
  add_to_cart: '🛒',
  checkout_start: '💳',
  checkout_complete: '✅',
  scroll_depth: '📜',
  rage_click: '😤',
  exit_page: '🚪',
  custom: '📍',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'עכשיו'
  if (m < 60) return `לפני ${m} דק'`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שע'`
  return `לפני ${Math.floor(h / 24)} ימים`
}

export default function VisitorAnalyticsPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'today' | 'week'>('today')
  const [activeJourney, setActiveJourney] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/visitors')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const convRate = stats && stats.checkoutCompletes > 0 && stats.totalWeek > 0
    ? ((stats.checkoutCompletes / stats.totalWeek) * 100).toFixed(1)
    : '0.0'

  const cartAbandonment = stats && stats.cartEvents > 0
    ? stats.checkoutCompletes > 0
      ? (((stats.cartEvents - stats.checkoutCompletes) / stats.cartEvents) * 100).toFixed(0)
      : '100'
    : '—'

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
          <p className="text-sm text-gray-500 mt-0.5">ניתוח תנועה, מקורות ומסעות לקוח — נתונים אמיתיים מ-MongoDB</p>
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
          { label: 'נטישת עגלה', value: cartAbandonment === '—' ? '—' : `${cartAbandonment}%`, sub: `${stats.cartEvents} הוסיפו לסל`, color: cartAbandonment === '—' ? 'text-gray-500' : Number(cartAbandonment) > 70 ? 'text-red-400' : 'text-emerald-400' },
          { label: 'המרה', value: `${convRate}%`, sub: `${stats.checkoutCompletes} רכישות`, color: Number(convRate) > 1 ? 'text-emerald-400' : 'text-gray-400' },
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
        <h2 className="text-sm font-semibold text-white mb-1">משפך המרה (7 ימים)</h2>
        <p className="text-xs text-gray-600 mb-5">מבקר ← מוצר ← עגלה ← תשלום ← רכישה</p>
        {[
          { label: 'ביקורי דף מוצר', value: stats.byEvent['product_view'] || 0, color: 'bg-blue-500' },
          { label: 'הוספה לסל', value: stats.cartEvents, color: 'bg-indigo-500' },
          { label: 'התחלת תשלום', value: stats.checkoutStarts, color: 'bg-violet-500' },
          { label: 'רכישה הושלמה', value: stats.checkoutCompletes, color: 'bg-emerald-500' },
        ].map((step, i, arr) => {
          const base = arr[0].value || 1
          const pct = Math.round((step.value / base) * 100)
          const prevValue = i > 0 ? arr[i-1].value : step.value
          const dropPct = prevValue > 0 ? Math.round((1 - step.value / prevValue) * 100) : 0
          return (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{step.label}</span>
                <div className="flex items-center gap-2">
                  {i > 0 && dropPct > 0 && (
                    <span className="text-red-400 text-[10px]">↓ {dropPct}% נשרו</span>
                  )}
                  <span className="text-white font-bold">{step.value.toLocaleString('he-IL')} <span className="text-gray-500 font-normal">({pct}%)</span></span>
                </div>
              </div>
              <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${Math.max(2, pct)}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Top pages */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">דפים פופולריים</h2>
          <p className="text-xs text-gray-600 mb-4">7 ימים אחרונים · pageview בלבד</p>
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
          <p className="text-xs text-gray-600 mb-4">7 ימים אחרונים</p>
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
          <p className="text-xs text-gray-600 mb-4">30 ימים אחרונים</p>
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
          <p className="text-xs text-gray-600 mb-4">היום</p>
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

      {/* Scroll depth + Countries row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Scroll depth */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">עומק גלילה ממוצע</h2>
          <p className="text-xs text-gray-600 mb-4">לפי דף · 7 ימים</p>
          {!stats.scrollDepth?.length ? (
            <p className="text-gray-600 text-xs text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-3">
              {stats.scrollDepth.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 truncate">{s.path || '/'}</span>
                    <span className={`font-bold ${s.avgScroll >= 75 ? 'text-emerald-400' : s.avgScroll >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{s.avgScroll}%</span>
                  </div>
                  <div className="bg-white/5 rounded-full h-2">
                    <div className={`h-full rounded-full ${s.avgScroll >= 75 ? 'bg-emerald-500' : s.avgScroll >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.avgScroll}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Countries */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">מדינות</h2>
          <p className="text-xs text-gray-600 mb-4">גיאוגרפיה · 7 ימים</p>
          {!stats.byCountry?.length ? (
            <p className="text-gray-600 text-xs text-center py-6">אין נתונים עדיין</p>
          ) : (
            <div className="space-y-2">
              {stats.byCountry.map((c, i) => {
                const total = stats.byCountry.reduce((a, b) => a + b.count, 0)
                const pct = Math.round((c.count / total) * 100)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 flex-1 truncate">{c.country}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-1.5">
                      <div className="h-full bg-teal-500/70 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-left">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-white mb-1">מסעות מבקרים אחרונים</h2>
        <p className="text-xs text-gray-600 mb-4">7 ימים אחרונים · לחץ על מסע לפרטים</p>
        {!stats.recentJourneys?.length ? (
          <p className="text-gray-600 text-xs text-center py-8">אין נתונים עדיין — אירועי מעקב יופיעו כאן אחרי ביקורים ראשונים</p>
        ) : (
          <div className="space-y-2">
            {stats.recentJourneys.map((journey) => {
              const isOpen = activeJourney === journey._id
              const converted = journey.events.some(e => e.event === 'checkout_complete')
              const addedToCart = journey.events.some(e => e.event === 'add_to_cart')
              const startedCheckout = journey.events.some(e => e.event === 'checkout_start')
              return (
                <div key={journey._id} className="border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setActiveJourney(isOpen ? null : journey._id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-right"
                  >
                    <span className="text-lg flex-shrink-0">
                      {converted ? '✅' : startedCheckout ? '💳' : addedToCart ? '🛒' : '👁'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-mono truncate">{journey.visitorId.slice(0, 8)}...</span>
                        <span className="text-[10px] text-gray-600">{journey.device || 'unknown'}</span>
                        {journey.country && <span className="text-[10px] text-gray-600">{journey.country}</span>}
                        {journey.language && <span className="text-[10px] text-gray-600">{journey.language}</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {journey.events.slice(0, 8).map((e, i) => (
                          <span key={i} className="text-xs" title={EVENT_LABELS[e.event] || e.event}>
                            {EVENT_ICONS[e.event] || '•'}
                          </span>
                        ))}
                        {journey.events.length > 8 && <span className="text-[10px] text-gray-600">+{journey.events.length - 8}</span>}
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-[10px] text-gray-600">{timeAgo(journey.lastSeen)}</p>
                      <p className="text-[10px] text-gray-700">{journey.events.length} אירועים</p>
                    </div>
                    <span className={`text-gray-500 text-xs flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      <div className="space-y-2">
                        {journey.events.map((e, i) => (
                          <div key={i} className="flex items-start gap-3 text-xs">
                            <span className="text-base flex-shrink-0 mt-0.5">{EVENT_ICONS[e.event] || '•'}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-300 font-medium">{EVENT_LABELS[e.event] || e.event}</span>
                              {e.path && <span className="text-gray-600 mr-2">{e.path}</span>}
                              {e.scroll > 0 && <span className="text-gray-600">· גלילה {e.scroll}%</span>}
                              {e.meta && Object.keys(e.meta).length > 0 && (
                                <span className="text-gray-700 mr-2 text-[10px]">
                                  {Object.entries(e.meta).filter(([k]) => k !== 'path').map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-700 flex-shrink-0">{new Date(e.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Data integrity note */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-blue-400 text-lg flex-shrink-0">ℹ</span>
        <div>
          <p className="text-xs font-semibold text-gray-300">נתונים בזמן אמת — ללא מוק</p>
          <p className="text-xs text-gray-600 mt-0.5">כל הנתונים מגיעים ממסד הנתונים (MongoDB). גיאוגרפיה מ-ip-api.com (800ms timeout). מכשיר/דפדפן מ-User-Agent. גלילה נמדדת מהדפדפן ב-25/50/75/100%.</p>
        </div>
      </div>
    </div>
  )
}
