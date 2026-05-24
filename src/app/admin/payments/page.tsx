'use client'
import { useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

const MOCK_PAYMENTS = [
  { id: 'TXN-9841', orderNumber: 'ORD-2026-0042', customer: 'מיכל כהן', amount: 19990, method: 'ויזה 4567', gateway: 'Cardcom', date: '2026-05-24 14:32', status: 'success' },
  { id: 'TXN-9840', orderNumber: 'ORD-2026-0041', customer: 'דני לוי', amount: 29990, method: 'מאסטרקארד 8821', gateway: 'Cardcom', date: '2026-05-23 11:15', status: 'success' },
  { id: 'TXN-9839', orderNumber: 'ORD-2026-0040', customer: 'שירה מזרחי', amount: 37990, method: 'ויזה 2234', gateway: 'Cardcom', date: '2026-05-22 16:48', status: 'success' },
  { id: 'TXN-9838', orderNumber: 'ORD-2026-0039', customer: 'יוסי אברהם', amount: 19990, method: 'ויזה 5593', gateway: 'Cardcom', date: '2026-05-21 09:20', status: 'failed' },
  { id: 'TXN-9837', orderNumber: 'ORD-2026-0038', customer: 'נועה ברק', amount: 29990, method: 'מאסטרקארד 7712', gateway: 'Cardcom', date: '2026-05-20 13:55', status: 'refunded' },
]

type TxnStatus = 'all' | 'success' | 'failed' | 'refunded'

export default function PaymentsPage() {
  const [filter, setFilter] = useState<TxnStatus>('all')

  const filtered = MOCK_PAYMENTS.filter((p) => filter === 'all' || p.status === filter)
  const totalSuccess = MOCK_PAYMENTS.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0)

  const statusLabel = (s: string) => s === 'success' ? 'הצליח' : s === 'failed' ? 'נכשל' : 'הוחזר'
  const statusColor = (s: string) =>
    s === 'success' ? 'bg-green-100 text-green-700' : s === 'failed' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-700'

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">תשלומים</h1>
          <p className="text-sm text-gray-500">עסקאות Cardcom</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">סה"כ עסקאות מוצלחות</p>
          <p className="text-2xl font-black text-green-600">{formatPrice(totalSuccess)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">עסקאות שנכשלו</p>
          <p className="text-2xl font-black text-red-500">{MOCK_PAYMENTS.filter((p) => p.status === 'failed').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">החזרים</p>
          <p className="text-2xl font-black text-orange-500">
            {formatPrice(MOCK_PAYMENTS.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'success', 'failed', 'refunded'] as TxnStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'הכל' : statusLabel(f)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">מזהה עסקה</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">לקוח</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">הזמנה</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">שיטת תשלום</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">סכום</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">תאריך</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">סטטוס</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-sm font-mono font-semibold text-gray-600">{txn.id}</td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-900">{txn.customer}</td>
                <td className="px-5 py-4 text-sm text-blue-600 hover:underline cursor-pointer">{txn.orderNumber}</td>
                <td className="px-5 py-4 text-sm text-gray-600">💳 {txn.method}</td>
                <td className="px-5 py-4 text-sm font-bold text-gray-900">{formatPrice(txn.amount)}</td>
                <td className="px-5 py-4 text-xs text-gray-500">{txn.date}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(txn.status)}`}>
                    {statusLabel(txn.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
