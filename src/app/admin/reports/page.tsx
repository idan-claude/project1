'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface Bucket { label: string; revenue: number; orders: number }
interface TopProduct { _id: string; units: number; revenue: number }

function BarChart({ data, color = '#2563EB' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-36 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{d.value > 0 ? formatPrice(d.value).replace('₪', '').trim() : ''}</span>
          <div className="w-full rounded-t-lg transition-all duration-500"
            style={{ height: `${(d.value / max) * 96}px`, backgroundColor: color, minHeight: d.value > 0 ? '4px' : '0' }} />
          <span className="text-xs text-gray-400 mt-1">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month'>('month')
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports?period=${period}`)
      .then(r => r.json())
      .then(d => {
        setBuckets(d.buckets || [])
        setTopProducts(d.topProducts || [])
        setTotalRevenue(d.totalRevenue || 0)
        setTotalOrders(d.totalOrders || 0)
      })
      .finally(() => setLoading(false))
  }, [period])

  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">דוחות</h1>
          <p className="text-sm text-gray-500">ניתוח ביצועים של החנות</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            שבועי
          </button>
          <button onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            חודשי
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">סה"כ הכנסות</p>
              <p className="text-2xl font-black text-blue-600">{formatPrice(totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">סה"כ הזמנות</p>
              <p className="text-2xl font-black text-gray-900">{totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">ממוצע הזמנה</p>
              <p className="text-2xl font-black text-gray-900">{formatPrice(avgOrder)}</p>
            </div>
          </div>

          {totalOrders === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-gray-600 font-semibold">אין נתונים עדיין</p>
              <p className="text-xs text-gray-400 mt-1">נתונים יופיעו לאחר הזמנות שנרכשו</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="font-bold text-gray-900 mb-1">הכנסות לפי {period === 'week' ? 'שבוע' : 'חודש'}</h2>
                <BarChart data={buckets.map(b => ({ label: b.label, value: b.revenue }))} color="#2563EB" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-1">הזמנות לפי {period === 'week' ? 'שבוע' : 'חודש'}</h2>
                  <BarChart data={buckets.map(b => ({ label: b.label, value: b.orders }))} color="#6366F1" />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-4">מוצרים מובילים</h2>
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">אין נתונים</p>
                  ) : (
                    <div className="space-y-3">
                      {topProducts.map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{p._id}</p>
                            <p className="text-xs text-gray-400">{p.units} יחידות · {formatPrice(p.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
