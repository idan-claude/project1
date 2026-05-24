'use client'
import { useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

const WEEKS = ['שבוע 1', 'שבוע 2', 'שבוע 3', 'שבוע 4']
const WEEK_REVENUE = [184900, 229900, 197400, 289900]
const WEEK_ORDERS = [9, 12, 10, 15]

const MONTHS_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי']
const MONTH_REVENUE = [820000, 940000, 1100000, 1380000, 1849900]

function BarChart({ data, labels, color = '#2563EB' }: { data: number[]; labels: string[]; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-2 h-36 mt-2">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500">{formatPrice(v).replace('₪', '').replace(',', 'K').trim()}</span>
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{ height: `${(v / max) * 96}px`, backgroundColor: color, minHeight: v > 0 ? '4px' : '0' }}
          />
          <span className="text-xs text-gray-400 mt-1">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month'>('month')

  const revenue = period === 'week' ? WEEK_REVENUE : MONTH_REVENUE
  const labels = period === 'week' ? WEEKS : MONTHS_SHORT
  const totalRevenue = revenue.reduce((s, v) => s + v, 0)
  const totalOrders = period === 'week' ? WEEK_ORDERS.reduce((s, v) => s + v, 0) : 94
  const avgOrder = Math.round(totalRevenue / totalOrders)

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

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">סה"כ הכנסות</p>
          <p className="text-2xl font-black text-blue-600">{formatPrice(totalRevenue)}</p>
          <p className="text-xs text-green-600 mt-1">↑ 18% לעומת אשתקד</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">סה"כ הזמנות</p>
          <p className="text-2xl font-black text-gray-900">{totalOrders}</p>
          <p className="text-xs text-green-600 mt-1">↑ 23% לעומת אשתקד</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">ממוצע הזמנה</p>
          <p className="text-2xl font-black text-gray-900">{formatPrice(avgOrder)}</p>
          <p className="text-xs text-green-600 mt-1">↑ 5% לעומת אשתקד</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="font-bold text-gray-900 mb-1">הכנסות לפי {period === 'week' ? 'שבוע' : 'חודש'}</h2>
        <BarChart data={revenue} labels={labels} color="#2563EB" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Orders chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">הזמנות לפי {period === 'week' ? 'שבוע' : 'חודש'}</h2>
          <BarChart
            data={period === 'week' ? WEEK_ORDERS : [8, 12, 14, 18, 23]}
            labels={labels}
            color="#6366F1"
          />
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">מוצרים מובילים</h2>
          <div className="space-y-3">
            {[
              { name: 'FindCard PRO — כרטיס אחד', units: 48, revenue: 959520 },
              { name: 'FindCard PRO — 2+1', units: 31, revenue: 929690 },
              { name: 'FindCard PRO — 3+1', units: 12, revenue: 455880 },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.units} יחידות · {formatPrice(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
