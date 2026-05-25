'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface FinanceData {
  today: { revenue: number; orders: number }
  month: { revenue: number; orders: number }
  lastMonth: { revenue: number; orders: number }
  byDay: Array<{ _id: string; revenue: number; count: number }>
  byStatus: Array<{ _id: string; count: number; revenue: number }>
}

const STATUS_HE: Record<string, string> = {
  new: 'חדשה', paid: 'שולמה', processing: 'בטיפול', shipped: 'נשלחה',
  delivered: 'נמסרה', cancelled: 'בוטלה', refunded: 'הוחזרה',
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/finance')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading || !data) return (
    <div className="p-6 min-h-screen bg-[#080C16] flex items-center justify-center">
      <div className="text-gray-600 text-sm animate-pulse">טוען נתוני פיננסים...</div>
    </div>
  )

  const growthPct = data.lastMonth.revenue > 0
    ? Math.round(((data.month.revenue - data.lastMonth.revenue) / data.lastMonth.revenue) * 100)
    : null

  const maxDay = Math.max(...data.byDay.map(d => d.revenue), 1)
  const totalRevenue = data.byStatus.filter(s => s._id !== 'cancelled').reduce((a, s) => a + s.revenue, 0)

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">פיננסים</h1>
        <p className="text-sm text-gray-500 mt-0.5">הכנסות, עסקאות ודוחות כספיים</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
          <p className="text-xs text-gray-600 mb-1">היום</p>
          <p className="text-3xl font-black text-blue-400">{data.today.revenue > 0 ? formatPrice(data.today.revenue) : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{data.today.orders} הזמנות</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
          <p className="text-xs text-gray-600 mb-1">החודש</p>
          <p className="text-3xl font-black text-emerald-400">{data.month.revenue > 0 ? formatPrice(data.month.revenue) : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.month.orders} הזמנות
            {growthPct !== null && (
              <span className={`mr-2 font-bold ${growthPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {growthPct >= 0 ? '+' : ''}{growthPct}% ממש"ח
              </span>
            )}
          </p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
          <p className="text-xs text-gray-600 mb-1">חודש שעבר</p>
          <p className="text-3xl font-black text-gray-400">{data.lastMonth.revenue > 0 ? formatPrice(data.lastMonth.revenue) : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">{data.lastMonth.orders} הזמנות</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 30-day chart */}
        <div className="lg:col-span-2 bg-[#0E1525] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">הכנסות 30 ימים אחרונים</h2>
          {data.byDay.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-700 text-sm">אין נתונים</div>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {data.byDay.map(d => {
                const pct = maxDay > 0 ? (d.revenue / maxDay) * 100 : 0
                return (
                  <div key={d._id} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1A2540] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {formatPrice(d.revenue)} · {d.count} הזמנות
                    </div>
                    <div className="w-full bg-emerald-500/75 rounded-sm"
                      style={{ height: `${Math.max(pct, 2)}%` }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* By status */}
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-bold text-white mb-4">הכנסות לפי סטטוס</h2>
          {data.byStatus.length === 0 ? (
            <div className="text-gray-700 text-sm text-center py-8">אין נתונים</div>
          ) : (
            <div className="space-y-2.5">
              {data.byStatus.map(s => {
                const pct = totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0
                return (
                  <div key={s._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{STATUS_HE[s._id] ?? s._id}</span>
                      <span className="text-gray-500">{s.count} · {formatPrice(s.revenue)}</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${s._id === 'cancelled' ? 'bg-red-500/50' : 'bg-blue-500/70'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Cardcom placeholder */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-600 mb-2">שער תשלומים</p>
            <div className="bg-white/5 rounded-lg px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-400">Cardcom</span>
              <span className="text-[10px] text-amber-400 font-medium">ממתין לחיבור</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
