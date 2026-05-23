'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Badge } from '@/components/ui/Badge'

const STATUS_TABS = [
  { key: '', label: 'כל ההזמנות' },
  { key: 'new', label: 'חדשות' },
  { key: 'processing', label: 'בטיפול' },
  { key: 'shipped', label: 'נשלחו' },
  { key: 'delivered', label: 'הושלמו' },
  { key: 'cancelled', label: 'בוטלו' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(status = '') {
    setLoading(true)
    const res = await fetch(`/api/admin/orders?status=${status}&limit=30`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">הזמנות ({total})</h1>

      <div className="flex gap-2 mb-6 border-b">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${statusFilter === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">מספר הזמנה</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">לקוח</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">תאריך</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">סכום</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">סטטוס</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">טוען...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">אין הזמנות</td></tr>}
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  <p>{o.customer?.name}</p>
                  <p className="text-xs text-gray-500">{o.customer?.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('he-IL')}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(o.pricing?.total || 0)}</td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o._id}`} className="text-blue-600 text-xs hover:underline">פרטים</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
