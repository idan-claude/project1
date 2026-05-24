'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Badge } from '@/components/ui/Badge'

const STATUS_TABS = [
  { key: '', label: 'הכל' },
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
    const res = await fetch(`/api/admin/orders?status=${status}&limit=50`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">הזמנות{total > 0 ? ` (${total})` : ''}</h1>
      </div>

      {/* Status tabs — scrollable on mobile */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
              statusFilter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-48" />
            </div>
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-600 font-semibold">אין הזמנות</p>
          {statusFilter && (
            <button onClick={() => setStatusFilter('')} className="mt-2 text-sm text-blue-600 hover:underline">
              הצג את כל ההזמנות
            </button>
          )}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <Link
                key={o._id}
                href={`/admin/orders/${o._id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{o.orderNumber}</p>
                    <p className="text-xs text-gray-500">{o.customer?.name}</p>
                  </div>
                  <Badge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('he-IL')}</p>
                  <p className="font-bold text-gray-900">{formatPrice(o.pricing?.total || 0)}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">מספר הזמנה</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">לקוח</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">תאריך</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">סכום</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">סטטוס</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{o.orderNumber}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{o.customer?.name}</p>
                      <p className="text-xs text-gray-400">{o.customer?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{new Date(o.createdAt).toLocaleDateString('he-IL')}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatPrice(o.pricing?.total || 0)}</td>
                    <td className="px-5 py-3.5"><Badge status={o.status} /></td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o._id}`} className="text-blue-600 text-xs font-medium hover:underline">
                        פרטים ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
