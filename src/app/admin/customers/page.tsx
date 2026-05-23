'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/customers?limit=30')
      .then((r) => r.json())
      .then((d) => { setCustomers(d.customers || []); setTotal(d.total || 0) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">לקוחות ({total})</h1>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">שם</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">אימייל</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">טלפון</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">תאריך הצטרפות</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">טוען...</td></tr>}
            {!loading && customers.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">אין לקוחות עדיין</td></tr>}
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString('he-IL')}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c._id}`} className="text-blue-600 text-xs hover:underline">פרטים</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
