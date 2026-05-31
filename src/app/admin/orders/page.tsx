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

function OrdersSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-[#0E1629] border border-white/[0.055] rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <div className="h-3.5 bg-white/[0.07] rounded w-28" />
            <div className="h-3.5 bg-white/[0.07] rounded w-16" />
          </div>
          <div className="h-3 bg-white/[0.04] rounded w-40" />
        </div>
      ))}
    </div>
  )
}

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
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--ds-text-1)]">הזמנות</h1>
          <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">
            {total > 0 ? `${total} הזמנות סה״כ` : 'ניהול וטיפול בהזמנות'}
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          הזמנה חדשה
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 bg-[#0E1629] border border-white/[0.055] rounded-xl p-1 overflow-x-auto admin-scroll w-fit max-w-full">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 text-[12.5px] font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
              statusFilter === key
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-[var(--ds-text-2)] hover:text-[var(--ds-text-1)] hover:bg-white/[0.04]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <OrdersSkeleton />}

      {!loading && orders.length === 0 && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl py-16 px-5 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.055] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[var(--ds-text-3)]">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <p className="text-[var(--ds-text-1)] font-semibold mb-1">אין הזמנות</p>
          <p className="text-[var(--ds-text-3)] text-sm">
            {statusFilter
              ? 'לא נמצאו הזמנות עם הסטטוס הנבחר'
              : 'הזמנות לקוחות יופיעו כאן ברגע שיבוצעו'}
          </p>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="mt-4 px-4 py-2 bg-blue-500/12 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/20 transition-colors"
            >
              הצג את כל ההזמנות
            </button>
          )}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-2">
            {orders.map((o) => (
              <Link
                key={o._id}
                href={`/admin/orders/${o._id}`}
                className="block bg-[#0E1629] border border-white/[0.055] rounded-xl p-4 hover:border-white/[0.09] hover:bg-[#121D33] transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-bold text-[var(--ds-text-1)] text-[13px]">{o.orderNumber}</p>
                    <p className="text-[11px] text-[var(--ds-text-3)]">{o.customer?.name}</p>
                  </div>
                  <Badge status={o.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[var(--ds-text-3)]">
                    {new Date(o.createdAt).toLocaleDateString('he-IL')}
                  </p>
                  <p className="font-bold text-[var(--ds-text-1)] text-[13px] num">
                    {formatPrice(o.pricing?.total || 0)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.055]">
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">מספר הזמנה</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">לקוח</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">תאריך</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">סכום</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">סטטוס</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-white/[0.025] transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-[var(--ds-text-1)] text-[13px]">{o.orderNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[var(--ds-text-1)] text-[13px]">{o.customer?.name}</p>
                      <p className="text-[11px] text-[var(--ds-text-3)]">{o.customer?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[var(--ds-text-2)]">
                      {new Date(o.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-[var(--ds-text-1)] text-[13px] num">
                        {formatPrice(o.pricing?.total || 0)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={o.status} />
                    </td>
                    <td className="px-5 py-3.5 text-left">
                      <Link
                        href={`/admin/orders/${o._id}`}
                        className="text-[11px] text-blue-400 font-medium hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-all"
                      >
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
