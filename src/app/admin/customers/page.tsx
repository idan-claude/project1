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
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-7">
        <div>
          <h1 className="text-xl font-bold text-[var(--ds-text-1)]">לקוחות</h1>
          <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">
            {total > 0 ? `${total} לקוחות רשומים` : 'רשימה ופרטי לקוחות'}
          </p>
        </div>
        <div className="sm:mr-auto sm:max-w-sm w-full">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ds-text-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(search)}
              placeholder="חיפוש לפי שם, אימייל, טלפון..."
              className="w-full bg-[#0E1629] border border-white/[0.055] rounded-xl pr-9 px-3 py-2 text-sm text-[var(--ds-text-1)] placeholder:text-[var(--ds-text-3)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white/[0.04] rounded-xl border border-white/[0.055]" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.055] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[var(--ds-text-3)]">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="text-[var(--ds-text-1)] font-semibold text-[13px]">אין לקוחות עדיין</p>
          <p className="text-[11px] text-[var(--ds-text-3)] mt-1">לקוחות יופיעו כאן לאחר ביצוע הזמנות</p>
        </div>
      ) : (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.055]">
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">שם</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide hidden md:table-cell">אימייל</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide hidden sm:table-cell">טלפון</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">הזמנות</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide hidden md:table-cell">סה"כ רכישות</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide hidden lg:table-cell">הזמנה אחרונה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {customers.map(c => (
                <tr key={c._id} className="hover:bg-white/[0.025] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-500/15 rounded-full flex items-center justify-center text-blue-400 font-bold text-[11px] flex-shrink-0">
                        {c.name?.[0] || '?'}
                      </div>
                      <span className="font-medium text-[var(--ds-text-1)] text-[13px] truncate max-w-[120px]">{c.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ds-text-2)] text-[13px] hidden md:table-cell">{c.email || '—'}</td>
                  <td className="px-5 py-3.5 text-[var(--ds-text-2)] text-[13px] hidden sm:table-cell">{c.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-blue-500/12 border border-blue-500/20 text-blue-400 font-bold text-[11px] px-2 py-0.5 rounded-full num">{c.orderCount}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[var(--ds-text-1)] text-[13px] num hidden md:table-cell">{formatPrice(c.totalSpent)}</td>
                  <td className="px-5 py-3.5 text-[var(--ds-text-3)] text-[11px] hidden lg:table-cell">
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
