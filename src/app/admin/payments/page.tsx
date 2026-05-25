'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface Payment {
  _id: string
  orderNumber: string
  customer: string
  amount: number
  method: string
  status: string
  createdAt: string
}

type FilterStatus = 'all' | 'paid' | 'pending' | 'failed' | 'refunded'

const STATUS_LABEL: Record<string, string> = { paid: 'שולם', pending: 'ממתין', failed: 'נכשל', refunded: 'הוחזר' }
const STATUS_COLOR: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-orange-100 text-orange-700',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalSuccess, setTotalSuccess] = useState(0)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/payments${filter !== 'all' ? `?status=${filter}` : ''}`)
      .then((r) => r.json())
      .then((d) => { setPayments(d.payments || []); setTotalSuccess(d.totalSuccess || 0) })
      .finally(() => setLoading(false))
  }, [filter])

  const FILTERS: FilterStatus[] = ['all', 'paid', 'pending', 'failed', 'refunded']
  const FILTER_LABELS: Record<FilterStatus, string> = { all: 'הכל', paid: 'שולם', pending: 'ממתין', failed: 'נכשל', refunded: 'הוחזר' }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">תשלומים</h1>
          <p className="text-sm text-gray-500">עסקאות Cardcom</p>
        </div>
        {totalSuccess > 0 && (
          <div className="sm:mr-auto bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <p className="text-xs text-green-600 font-medium">סה"כ הכנסות</p>
            <p className="text-lg font-black text-green-700">{formatPrice(totalSuccess)}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-gray-600 font-semibold">אין עסקאות עדיין</p>
          <p className="text-xs text-gray-400 mt-1">כשלקוח ישלם — העסקה תופיע כאן</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">הזמנה</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden md:table-cell">לקוח</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">סכום</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden md:table-cell">אמצעי תשלום</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">סטטוס</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden lg:table-cell">תאריך</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{p.orderNumber}</td>
                  <td className="px-5 py-3.5 text-gray-800 hidden md:table-cell">{p.customer}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">{formatPrice(p.amount)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs hidden md:table-cell">{p.method}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                    {new Date(p.createdAt).toLocaleDateString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
