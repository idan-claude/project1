'use client'
import { useEffect, useState } from 'react'

interface ExecutiveData {
  revenue: {
    today: number; yesterday: number; todayDelta: number | null
    last7d: number; last30d: number; growth30d: number | null
  }
  orders: { today: number; last7d: number; last30d: number; growth30d: number | null; avgValue7d: number }
  visitors: { today: number; last7d: number; last30d: number }
  funnel: {
    visitors7d: number; cartAdds7d: number; checkoutStarts7d: number; purchases7d: number
    cartRate7d: number; checkoutRate7d: number; purchaseRate7d: number; conversionRate7d: number
  }
  topProducts: Array<{ slug: string; name: string; revenue: number; units: number; orders: number }>
  topSources: Array<{ source: string; visitors: number; revenue: number; orders: number }>
  recentOrders: Array<{ orderNumber: string; customer: string; total: number; createdAt: string; source: string }>
  dailyTrend: Array<{ date: string; revenue: number; orders: number }>
  meta: { productCount: number; returningVisitors: number; returningRate: number }
}

function Delta({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-xs text-gray-400">—</span>
  const positive = value >= 0
  return (
    <span className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? '↑' : '↓'} {Math.abs(value)}{suffix}
    </span>
  )
}

function KPI({ label, value, delta, sub }: { label: string; value: string | number; delta?: number | null; sub?: string }) {
  return (
    <div className="bg-[#111] border border-white/5 rounded-xl p-5 flex flex-col gap-1 hover:border-white/10 transition-colors">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-2xl font-semibold text-white tracking-tight">{value}</span>
        {delta !== undefined && <Delta value={delta ?? null} />}
      </div>
      {sub && <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function FunnelBar({ label, value, max, rate }: { label: string; value: number; max: number; rate?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{label}</span>
        <div className="flex gap-2 items-center">
          <span className="text-xs font-semibold text-white">{value.toLocaleString()}</span>
          {rate !== undefined && <span className="text-[10px] text-gray-500">{rate}%</span>}
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ExecutivePage() {
  const [data, setData] = useState<ExecutiveData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/executive')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-600">טוען נתוני Executive...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-500 text-sm">שגיאה בטעינת נתונים</p>
      </div>
    )
  }

  const { revenue, orders, visitors, funnel, topProducts, topSources, recentOrders, dailyTrend, meta } = data

  const maxTrend = Math.max(...dailyTrend.map(d => d.revenue), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Executive</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetch('/api/admin/executive').then(r => r.json()).then(d => { setData(d); setLoading(false) }) }}
            className="text-[11px] text-gray-500 hover:text-white border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 transition-all"
          >
            רענן
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* Revenue KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI
            label="הכנסה היום"
            value={`₪${revenue.today.toLocaleString()}`}
            delta={revenue.todayDelta}
            sub={`אתמול: ₪${revenue.yesterday.toLocaleString()}`}
          />
          <KPI
            label="הכנסה 7 ימים"
            value={`₪${revenue.last7d.toLocaleString()}`}
            sub={`${orders.last7d} הזמנות`}
          />
          <KPI
            label="הכנסה 30 ימים"
            value={`₪${revenue.last30d.toLocaleString()}`}
            delta={revenue.growth30d}
            sub={`${orders.last30d} הזמנות`}
          />
          <KPI
            label="AOV ממוצע"
            value={`₪${orders.avgValue7d.toLocaleString()}`}
            sub="לפי 7 ימים"
          />
        </div>

        {/* Visitors + Funnel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="מבקרים היום" value={visitors.today.toLocaleString()} />
          <KPI label="מבקרים 7 ימים" value={visitors.last7d.toLocaleString()} />
          <KPI
            label="המרה 7 ימים"
            value={`${funnel.conversionRate7d}%`}
            sub={`${funnel.purchases7d} רכישות`}
          />
          <KPI
            label="חוזרים 7 ימים"
            value={`${meta.returningRate}%`}
            sub={`${meta.returningVisitors} מבקרים`}
          />
        </div>

        {/* Revenue Trend + Funnel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 7-day Revenue Trend */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-5">מגמת הכנסה 7 ימים</h3>
            {dailyTrend.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-gray-600 text-xs">אין נתונים</div>
            ) : (
              <div className="flex items-end gap-2 h-28">
                {dailyTrend.map(d => {
                  const height = Math.max(4, Math.round((d.revenue / maxTrend) * 100))
                  const dateLabel = new Date(d.date).toLocaleDateString('he-IL', { weekday: 'short' })
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full bg-indigo-500/20 rounded-sm group-hover:bg-indigo-500/40 transition-colors cursor-default"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[9px] text-gray-600">{dateLabel}</span>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        ₪{d.revenue.toLocaleString()} · {d.orders} הזמנות
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Funnel */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-5">משפך רכישה 7 ימים</h3>
            <div className="space-y-4">
              <FunnelBar label="מבקרים" value={funnel.visitors7d} max={funnel.visitors7d} />
              <FunnelBar label="הוספות לעגלה" value={funnel.cartAdds7d} max={funnel.visitors7d} rate={funnel.cartRate7d} />
              <FunnelBar label="התחלות Checkout" value={funnel.checkoutStarts7d} max={funnel.visitors7d} rate={funnel.checkoutRate7d} />
              <FunnelBar label="רכישות (תשלום אמיתי)" value={funnel.purchases7d} max={funnel.visitors7d} rate={funnel.purchaseRate7d} />
            </div>
          </div>
        </div>

        {/* Top Products + Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Top Products */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-4">מוצרים מובילים</h3>
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-600 py-4 text-center">אין נתוני מכירות עדיין</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-600 w-4">{i + 1}</span>
                      <div>
                        <p className="text-xs font-medium text-white">{p.name}</p>
                        <p className="text-[10px] text-gray-500">{p.units} יחידות · {p.orders} הזמנות</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-white">₪{p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Sources */}
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-4">מקורות תנועה</h3>
            {topSources.length === 0 ? (
              <p className="text-xs text-gray-600 py-4 text-center">אין נתוני מקור עדיין</p>
            ) : (
              <div className="space-y-3">
                {topSources.slice(0, 5).map(s => (
                  <div key={s.source} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">{s.source}</p>
                      <p className="text-[10px] text-gray-500">{s.visitors.toLocaleString()} מבקרים</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-white">{s.orders > 0 ? `₪${Math.round(s.revenue / 100).toLocaleString()}` : '—'}</p>
                      <p className="text-[10px] text-gray-500">{s.orders} הזמנות</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-[#111] border border-white/5 rounded-xl p-5">
          <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-4">הזמנות אחרונות (תשלום אמיתי)</h3>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-2xl">📦</p>
              <p className="text-sm text-gray-500">אין הזמנות ששולמו עדיין</p>
              <p className="text-xs text-gray-600">הזמנות יופיעו כאן לאחר אישור תשלום אמיתי</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-gray-600 uppercase">
                    <th className="text-right pb-3 font-medium">הזמנה</th>
                    <th className="text-right pb-3 font-medium">לקוח</th>
                    <th className="text-right pb-3 font-medium">מקור</th>
                    <th className="text-right pb-3 font-medium">תאריך</th>
                    <th className="text-right pb-3 font-medium">סכום</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.map(o => (
                    <tr key={o.orderNumber} className="hover:bg-white/2 transition-colors">
                      <td className="py-2.5 font-mono text-indigo-400">#{o.orderNumber}</td>
                      <td className="py-2.5 text-white">{o.customer}</td>
                      <td className="py-2.5 text-gray-400">{o.source}</td>
                      <td className="py-2.5 text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2.5 font-semibold text-white">₪{o.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
