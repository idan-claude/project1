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

function MiniBar({ value, max, cls = '' }: { value: number; max: number; cls?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${cls || 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState<'7' | '30'>('7')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading || !data) return (
    <div className="p-6 min-h-screen bg-[#080C16] flex items-center justify-center">
      <div className="text-gray-600 text-sm animate-pulse">טוען נתוני אנליטיקה...</div>
    </div>
  )

  const chartData = period === '7' ? data.last7days : data.last30days
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const maxHour = Math.max(...data.conversionByHour.map(h => h.count), 1)

  const dayLabels: Record<string, string> = { 'א': 'א', '0': 'א', '1': 'ב', '2': 'ג', '3': 'ד', '4': 'ה', '5': 'ו', '6': 'ש' }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">אנליטיקה</h1>
        <p className="text-sm text-gray-500 mt-0.5">ביצועי חנות ריאלטיים</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'הכנסה כוללת', val: formatPrice(data.totals.revenue), sub: 'מכל הזמנים', cls: 'text-blue-400' },
          { label: 'סה"כ הזמנות', val: data.totals.orders, sub: 'לא בוטלו', cls: 'text-emerald-400' },
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
        {/* Revenue chart */}
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">הכנסות לאורך זמן</h2>
            <div className="flex gap-1">
              {(['7', '30'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    period === p ? 'bg-blue-500/20 text-blue-400' : 'text-gray-600 hover:text-gray-400'
                  }`}>
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
                    <div className="w-full bg-blue-500/80 rounded-sm transition-all"
                      style={{ height: `${Math.max(pct, 2)}%` }} />
                    <span className="text-[9px] text-gray-600">{day}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top products */}
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

      {/* Peak hours */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-4">שעות פעילות שיא (30 ימים אחרונים)</h2>
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
                  <div className={`w-full rounded-sm transition-all ${count > 0 ? 'bg-violet-500/70' : 'bg-white/5'}`}
                    style={{ height: `${Math.max(pct, 4)}%` }} />
                  {h % 6 === 0 && <span className="text-[8px] text-gray-700">{h}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
