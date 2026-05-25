'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface Customer {
  _id: string
  name: string
  email: string
  phone: string
  orderCount: number
  totalSpent: number
  lastOrder: string
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  function load(q = '') {
    setLoading(true)
    fetch(`/api/admin/customers${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.json())
      .then(d => { setCustomers(d.customers || []); setTotal(d.total || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">לקוחות ({total})</h1>
        <div className="sm:mr-auto max-w-sm w-full">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(search)}
            placeholder="חיפוש לפי שם, אימייל, טלפון..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-600 font-semibold">אין לקוחות עדיין</p>
          <p className="text-xs text-gray-400 mt-1">לקוחות יופיעו כאן לאחר ביצוע הזמנות</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">שם</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden md:table-cell">אימייל</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden sm:table-cell">טלפון</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">הזמנות</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden md:table-cell">סה"כ רכישות</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden lg:table-cell">הזמנה אחרונה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map(c => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {c.name?.[0] || '?'}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[120px]">{c.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{c.email || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600 hidden sm:table-cell">{c.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-0.5 rounded-full">{c.orderCount}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900 hidden md:table-cell">{formatPrice(c.totalSpent)}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                    {new Date(c.lastOrder).toLocaleDateString('he-IL')}
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
