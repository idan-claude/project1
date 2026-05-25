'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(d => { setCustomers(Array.isArray(d) ? d : d.customers ?? []); setLoading(false) })
  }, [])

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const vip = customers.filter(c => c.orderCount >= 2)
  const avgLTV = customers.length > 0 ? Math.round(customers.reduce((a, c) => a + c.totalSpent, 0) / customers.length) : 0

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">CRM — קשרי לקוחות</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניהול לקוחות, היסטוריה ופרופיל</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-black text-white">{customers.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">סה"כ לקוחות</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-black text-amber-400">{vip.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">לקוחות חוזרים</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4 col-span-2">
          <p className="text-2xl font-black text-blue-400">{avgLTV > 0 ? formatPrice(avgLTV) : '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">ממוצע LTV לקוח</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, אימייל או טלפון..."
          className="w-full sm:max-w-sm bg-[#0E1525] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">{search ? 'לא נמצאו לקוחות' : 'אין לקוחות עדיין'}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-white/5">
                <th className="text-right px-4 py-2.5 font-medium">לקוח</th>
                <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">הזמנות</th>
                <th className="text-right px-4 py-2.5 font-medium">סה"כ</th>
                <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">הזמנה אחרונה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(c => (
                <tr key={c._id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-[13px]">{c.name || '—'}</p>
                    <p className="text-gray-600 text-[11px]">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-[13px]">{c.orderCount}</span>
                      {c.orderCount >= 2 && <span className="text-[10px] text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded-full">VIP</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-blue-400 font-bold text-[13px]">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600 text-[12px]">
                    {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('he-IL') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
