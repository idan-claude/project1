'use client'
import { useEffect, useState } from 'react'

interface FunnelData {
  totalOrders: number
  paidOrders: number
  cancelledOrders: number
  avgOrderValue: number
}

export default function FunnelsPage() {
  const [data, setData] = useState<FunnelData | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then((d: any) => {
        setData({
          totalOrders: d.orderCountMonth ?? 0,
          paidOrders: d.orderCountMonth ?? 0,
          cancelledOrders: 0,
          avgOrderValue: d.avgOrderValue ?? 0,
        })
      })
  }, [])

  const steps = [
    { label: 'ביקורו בדף המוצר', val: '—', sub: 'נתוני ביקורים בקרוב' },
    { label: 'הוסיפו לסל', val: '—', sub: 'מחייב tracking' },
    { label: 'הגיעו לתשלום', val: '—', sub: 'מחייב tracking' },
    { label: 'השלימו רכישה', val: data?.totalOrders ?? '—', sub: 'מהזמנות בפועל' },
  ]

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">משפכי המרה</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניתוח המרות ונקודות נפילה</p>
      </div>

      <div className="bg-[#0E1525] border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-blue-400 text-lg flex-shrink-0">📊</span>
        <div>
          <p className="text-sm font-semibold text-blue-400">מעקב אירועים בפיתוח</p>
          <p className="text-xs text-gray-500 mt-0.5">לניתוח מלא של המשפך נדרשת הוספת event tracking לדפי החנות.</p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.label} className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-300">{step.label}</p>
              <p className="text-xs text-gray-600 mt-0.5">{step.sub}</p>
            </div>
            <span className="text-lg font-black text-white">{step.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
