'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface AnalyticsData {
  totals: { revenue: number; orders: number; avgOrder: number; uniqueCustomers: number }
  last7days: Array<{ _id: string; revenue: number; orders: number }>
  last30days: Array<{ _id: string; revenue: number; orders: number }>
  topProducts: Array<{ _id: string; name: string; revenue: number; units: number; orders: number }>
  conversionByHour: Array<{ _id: number; count: number }>
}

interface ConversionData {
  totalSessions: number
  overallConversionRate: number
  overallAtcRate: number
  totalConverted: number
  totalAtc: number
  bySource: Array<{ source: string; sessions: number; conversions: number; convRate: number; atcRate: number }>
  byDevice: Array<{ device: string; sessions: number; conversions: number; convRate: number; atcRate: number }>
  faqImpact: {
    withFaq: { sessions: number; convRate: number; atcRate: number }
    withoutFaq: { sessions: number; convRate: number; atcRate: number }
  } | null
  galleryImpact: {
    withGallery: { sessions: number; convRate: number; atcRate: number }
    withoutGallery: { sessions: number; convRate: number; atcRate: number }
  } | null
  scrollImpact: Array<{ label: string; sessions: number; convRate: number; atcRate: number }>
  topConversionBlockers: Array<{ insight: string; severity: 'high' | 'medium' | 'low'; metric: string }>
  topCampaigns: Array<{ campaign: string; sessions: number; convRate: number; conversions: number }>
  topFaqOpens: Array<{ question: string; count: number }>
}

function MiniBar({ value, max, cls = '' }: { value: number; max: number; cls?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${cls || 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

type Tab = 'revenue' | 'conversion'

export default function AnalyticsPage() {
  const [tab, setTab]       = useState<Tab>('revenue')
  const [data, setData]     = useState<AnalyticsData | null>(null)
  const [conv, setConv]     = useState<ConversionData | null>(null)
  const [period, setPeriod] = useState<'7' | '30'>('7')
  const [loading, setLoading]   = useState(true)
  const [convLoading, setConvLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  useEffect(() => {
    if (tab === 'conversion' && !conv) {
      setConvLoading(true)
      fetch('/api/admin/analytics/conversion')
        .then(r => r.json())
        .then(d => { setConv(d); setConvLoading(false) })
        .catch(() => setConvLoading(false))
    }
  }, [tab, conv])

  if (loading || !data) return (
    <div className="p-5 md:p-7 min-h-screen bg-[#070B14] animate-pulse">
      <div className="h-7 bg-white/[0.05] rounded-lg w-32 mb-1.5" />
      <div className="h-4 bg-white/[0.03] rounded w-56 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/[0.04] rounded-xl border border-white/[0.055]" />)}
      </div>
    </div>
  )

  const chartData  = period === '7' ? data.last7days : data.last30days
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const maxHour    = Math.max(...data.conversionByHour.map(h => h.count), 1)

  const deviceLabels: Record<string, string>  = { mobile: 'מובייל', desktop: 'דסקטופ', tablet: 'טאבלט', unknown: 'לא ידוע' }
  const deviceIcons: Record<string, string>   = { mobile: '📱', desktop: '🖥️', tablet: '📲', unknown: '❓' }
  const severityColors: Record<string, string> = { high: 'text-red-400 border-red-400/20 bg-red-400/5', medium: 'text-amber-400 border-amber-400/20 bg-amber-400/5', low: 'text-blue-400 border-blue-400/20 bg-blue-400/5' }

  return (
    <div className="p-5 md:p-7 min-h-screen bg-[#070B14]" dir="rtl">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-[var(--ds-text-1)]">אנליטיקה</h1>
        <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">נתונים אמיתיים מ-MongoDB בלבד — ללא מוק</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#0E1525] border border-white/5 rounded-xl p-1 w-fit">
        {[
          { id: 'revenue' as Tab, label: 'הכנסות' },
          { id: 'conversion' as Tab, label: 'המרות ואינטליגנציה' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ REVENUE TAB ═══ */}
      {tab === 'revenue' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'הכנסה כוללת', val: formatPrice(data.totals.revenue), sub: 'מכל הזמנים', cls: 'text-blue-400' },
              { label: 'סה"כ הזמנות', val: data.totals.orders, sub: 'שולמו בלבד', cls: 'text-emerald-400' },
              { label: 'ממוצע הזמנה', val: formatPrice(data.totals.avgOrder), sub: 'AOV', cls: 'text-violet-400' },
              { label: 'לקוחות ייחודיים', val: data.totals.uniqueCustomers, sub: 'לפי אימייל', cls: 'text-amber-400' },
            ].map(k => (
              <div key={k.label} className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
                <p className={`text-2xl font-black ${k.cls}`}>{k.val}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{k.label}</p>
                <p className="text-[11px] text-gray-600">{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">הכנסות לאורך זמן</h2>
                <div className="flex gap-1">
                  {(['7', '30'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${period === p ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600 hover:text-gray-400'}`}>
                      {p} ימים
                    </button>
                  ))}
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-gray-700 text-sm">אין נתונים לתקופה זו</div>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {chartData.map(d => {
                    const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0
                    const day = d._id.slice(-2)
                    return (
                      <div key={d._id} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1A2540] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {formatPrice(d.revenue)}
                        </div>
                        <div className="w-full bg-blue-500/80 rounded-sm" style={{ height: `${Math.max(pct, 2)}%` }} />
                        <span className="text-[9px] text-gray-600">{day}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
              <h2 className="text-sm font-bold text-white mb-4">מוצרים מובילים</h2>
              {data.topProducts.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-gray-700 text-sm">אין נתוני מכירות</div>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => {
                    const maxP = data.topProducts[0].revenue
                    return (
                      <div key={p._id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-700 w-4 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-200 truncate">{p.name || '—'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MiniBar value={p.revenue} max={maxP} cls="bg-blue-500" />
                            <span className="text-[11px] text-blue-400 flex-shrink-0">{formatPrice(p.revenue)}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-gray-600 flex-shrink-0">{p.units} יח׳</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
            <h2 className="text-sm font-bold text-white mb-4">שעות פעילות שיא (30 ימים)</h2>
            {data.conversionByHour.length === 0 ? (
              <div className="h-16 flex items-center justify-center text-gray-700 text-sm">אין נתוני שעות</div>
            ) : (
              <div className="flex items-end gap-0.5 h-16">
                {Array.from({ length: 24 }, (_, h) => {
                  const found = data.conversionByHour.find(x => x._id === h)
                  const count = found?.count ?? 0
                  const pct = maxHour > 0 ? (count / maxHour) * 100 : 0
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#1A2540] border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {h}:00 — {count} הזמנות
                      </div>
                      <div className={`w-full rounded-sm ${count > 0 ? 'bg-violet-500/70' : 'bg-white/5'}`} style={{ height: `${Math.max(pct, 4)}%` }} />
                      {h % 6 === 0 && <span className="text-[8px] text-gray-700">{h}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ CONVERSION INTELLIGENCE TAB ═══ */}
      {tab === 'conversion' && (
        <>
          {convLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#0E1525] rounded-2xl animate-pulse" />)}</div>
          ) : !conv || conv.totalSessions === 0 ? (
            <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-10 text-center">
              <p className="text-3xl mb-3">📊</p>
              <p className="text-gray-400 font-semibold">אין מספיק נתונים עדיין</p>
              <p className="text-xs text-gray-600 mt-2">נתוני המרה יופיעו כאן לאחר ביקורים ראשוניים במחנות</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'סשנים (30 יום)', val: conv.totalSessions.toLocaleString('he-IL'), cls: 'text-white' },
                  { label: 'שיעור המרה', val: `${conv.overallConversionRate}%`, cls: conv.overallConversionRate > 1 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'שיעור ATC', val: `${conv.overallAtcRate}%`, cls: conv.overallAtcRate > 3 ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'רכישות', val: conv.totalConverted, cls: 'text-blue-400' },
                ].map(k => (
                  <div key={k.label} className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
                    <p className={`text-2xl font-black ${k.cls}`}>{k.val}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Conversion Blockers */}
              {conv.topConversionBlockers.length > 0 && (
                <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-5">
                  <h2 className="text-sm font-semibold text-white mb-1">חסמי המרה — מהנתונים</h2>
                  <p className="text-xs text-gray-600 mb-4">תובנות שנוצרו מנתוני סשנים אמיתיים בלבד</p>
                  <div className="space-y-2">
                    {conv.topConversionBlockers.map((b, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${severityColors[b.severity]}`}>
                        <span className="text-lg flex-shrink-0">{b.severity === 'high' ? '🔴' : b.severity === 'medium' ? '🟡' : '🔵'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{b.insight}</p>
                          <p className="text-[11px] opacity-70 mt-0.5">{b.metric}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Source conversion */}
                <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-1">המרה לפי מקור תנועה</h2>
                  <p className="text-xs text-gray-600 mb-4">UTM source · 30 ימים</p>
                  {conv.bySource.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-4">אין נתוני UTM עדיין</p>
                  ) : (
                    <div className="space-y-3">
                      {conv.bySource.slice(0, 7).map((s, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-300 truncate flex-1">{s.source}</span>
                            <span className="text-gray-500 mx-2">{s.sessions} סשנים</span>
                            <span className={`font-bold w-12 text-left ${s.convRate > 1 ? 'text-emerald-400' : 'text-gray-400'}`}>{s.convRate}%</span>
                          </div>
                          <div className="bg-white/5 rounded-full h-1.5">
                            <div className={`h-full rounded-full ${s.convRate > 1 ? 'bg-emerald-500/60' : 'bg-gray-600/60'}`}
                              style={{ width: `${Math.min(s.convRate * 10, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Device conversion */}
                <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-1">המרה לפי מכשיר</h2>
                  <p className="text-xs text-gray-600 mb-4">30 ימים</p>
                  <div className="space-y-4">
                    {conv.byDevice.map((d, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span>{deviceIcons[d.device] || '📱'}</span>
                          <span className="text-sm font-semibold text-white">{deviceLabels[d.device] || d.device}</span>
                          <span className="text-xs text-gray-600 mr-auto">{d.sessions} סשנים</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#080C16] rounded-lg p-2 text-center">
                            <p className={`text-lg font-black ${d.convRate > 1 ? 'text-emerald-400' : 'text-gray-500'}`}>{d.convRate}%</p>
                            <p className="text-[10px] text-gray-600">המרה</p>
                          </div>
                          <div className="bg-[#080C16] rounded-lg p-2 text-center">
                            <p className={`text-lg font-black ${d.atcRate > 3 ? 'text-blue-400' : 'text-gray-500'}`}>{d.atcRate}%</p>
                            <p className="text-[10px] text-gray-600">ATC</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ impact */}
                {conv.faqImpact && (conv.faqImpact.withFaq.sessions > 0 || conv.faqImpact.withoutFaq.sessions > 0) && (
                  <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-1">השפעת FAQ על המרה</h2>
                    <p className="text-xs text-gray-600 mb-4">מבקרים שפתחו שאלה נפוצה vs. לא</p>
                    <div className="space-y-3">
                      {[
                        { label: 'פתחו FAQ', data: conv.faqImpact.withFaq, color: 'bg-blue-500' },
                        { label: 'לא פתחו FAQ', data: conv.faqImpact.withoutFaq, color: 'bg-gray-600' },
                      ].map((row, i) => (
                        <div key={i} className="bg-[#080C16] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-300">{row.label}</span>
                            <span className="text-[11px] text-gray-600">{row.data.sessions} סשנים</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-gray-600 mb-0.5">המרה</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white/5 rounded-full h-2">
                                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(row.data.convRate * 10, 100)}%` }} />
                                </div>
                                <span className="text-xs font-bold text-white w-8">{row.data.convRate}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-600 mb-0.5">ATC</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white/5 rounded-full h-2">
                                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.min(row.data.atcRate * 5, 100)}%` }} />
                                </div>
                                <span className="text-xs font-bold text-white w-8">{row.data.atcRate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scroll depth vs conversion */}
                {conv.scrollImpact.length > 0 && (
                  <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-1">גלילה vs. המרה</h2>
                    <p className="text-xs text-gray-600 mb-4">עומק גלילה מקסימלי בסשן vs. שיעור המרה</p>
                    <div className="space-y-2">
                      {conv.scrollImpact.map((band, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="text-gray-400 w-14 flex-shrink-0">{band.label}</span>
                          <div className="flex-1 bg-white/5 rounded-full h-2">
                            <div className={`h-full rounded-full ${band.convRate > 1 ? 'bg-emerald-500/70' : 'bg-gray-700'}`}
                              style={{ width: `${Math.min(band.convRate * 10, 100)}%` }} />
                          </div>
                          <span className={`font-bold w-10 text-left ${band.convRate > 1 ? 'text-emerald-400' : 'text-gray-600'}`}>{band.convRate}%</span>
                          <span className="text-gray-700 w-10">{band.sessions} סשן</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top FAQ opens */}
              {conv.topFaqOpens.length > 0 && (
                <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-5">
                  <h2 className="text-sm font-semibold text-white mb-1">שאלות נפוצות — הכי נפתחות</h2>
                  <p className="text-xs text-gray-600 mb-4">7 ימים אחרונים · מהנתונים בלבד</p>
                  <div className="space-y-2">
                    {conv.topFaqOpens.map((f, i) => {
                      const max = conv.topFaqOpens[0]?.count || 1
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                          <span className="text-xs text-gray-300 flex-1 truncate">{f.question || '—'}</span>
                          <div className="w-24 bg-white/5 rounded-full h-1.5">
                            <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${(f.count / max) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-amber-400 w-6">{f.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Top campaigns */}
              {conv.topCampaigns.length > 0 && (
                <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-5">
                  <h2 className="text-sm font-semibold text-white mb-1">קמפיינים מובילים</h2>
                  <p className="text-xs text-gray-600 mb-4">UTM campaign · לפי שיעור המרה</p>
                  <div className="space-y-2">
                    {conv.topCampaigns.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-xs text-gray-300 font-semibold">{c.campaign}</p>
                          <p className="text-[10px] text-gray-600">{c.sessions} סשנים · {c.conversions} רכישות</p>
                        </div>
                        <span className={`text-sm font-black ${c.convRate > 1 ? 'text-emerald-400' : 'text-gray-500'}`}>{c.convRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-blue-400 text-lg flex-shrink-0">ℹ</span>
                <p className="text-xs text-gray-600">כל התובנות מחושבות מסשני VisitorEvent אמיתיים ב-MongoDB. אין AI, אין מוק, אין הנחות. חסמי המרה מופיעים רק כשיש מספיק נתונים לחישוב סטטיסטי.</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
