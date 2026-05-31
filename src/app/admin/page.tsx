'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Badge } from '@/components/ui/Badge'

interface DashboardData {
  revenueToday: number
  orderCountToday: number
  revenueMonth: number
  orderCountMonth: number
  openOrders: number
  totalCustomers: number
  newCustomersToday: number
  avgOrderValue: number
  conversionRate: number
  cartRate: number
  recentOrders: Array<{
    _id: string
    orderNumber: string
    customer: { name: string }
    pricing: { total: number }
    status: string
    createdAt: string
  }>
  lowStockProducts: Array<{
    _id: string
    nameHe: string
    slug: string
    inventory: { quantity: number }
  }>
}

/* ── Inline icons ─────────────────────────────────────── */
type P = { className?: string }
const Ic = ({ className, d }: { className?: string; d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <path d={d}/>
  </svg>
)

const ITrendUp = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-3 h-3'}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const RevenueIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const CalendarIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const OrderIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

const UsersIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const TargetIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

const CartIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)

const BarIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-5 h-5'}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

const PlusIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const AlertIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

/* ── Skeleton ─────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen animate-pulse">
      <div className="h-7 bg-white/[0.05] rounded-lg w-44 mb-1.5" />
      <div className="h-4 bg-white/[0.03] rounded w-56 mb-7" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white/[0.04] rounded-2xl border border-white/[0.055]" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl border border-white/[0.055]" />)}
      </div>
      <div className="h-48 bg-white/[0.04] rounded-2xl border border-white/[0.055] mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-52 bg-white/[0.04] rounded-2xl border border-white/[0.055]" />
        <div className="h-52 bg-white/[0.04] rounded-2xl border border-white/[0.055]" />
      </div>
    </div>
  )
}

/* ── KPI Card ─────────────────────────────────────────── */
function KpiCard({
  label, value, sub, Icon, accent, trend,
}: {
  label: string
  value: string
  sub: string
  Icon: React.ComponentType<P>
  accent: { icon: string; bg: string; text: string }
  trend?: { up: boolean; label: string } | null
}) {
  return (
    <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4 hover:border-white/[0.09] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 ${accent.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${accent.text}`} />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
            <ITrendUp className={`w-2.5 h-2.5 ${trend.up ? '' : 'rotate-180'}`} />
            {trend.label}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold num ${accent.text} leading-none mb-1`}>{value}</p>
      <p className="text-[12px] font-semibold text-[var(--ds-text-1)] leading-none">{label}</p>
      <p className="text-[11px] text-[var(--ds-text-3)] mt-0.5">{sub}</p>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData) => { setData(d); setError(false) })
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) window.location.href = `/admin/orders?q=${encodeURIComponent(search)}`
  }

  if (error) {
    return (
      <div className="p-8 bg-[#070B14] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertIcon className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-[var(--ds-text-1)] font-semibold mb-1">לא ניתן להתחבר לשרת</p>
          <p className="text-[var(--ds-text-3)] text-sm mb-4">בדוק את החיבור ונסה שוב</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500/15 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/25 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  if (!data) return <DashboardSkeleton />

  const kpis = [
    {
      label: 'הכנסות היום',
      value: data.revenueToday > 0 ? formatPrice(data.revenueToday) : '—',
      sub: data.orderCountToday > 0 ? `${data.orderCountToday} הזמנות היום` : 'אין הזמנות היום',
      Icon: RevenueIcon,
      accent: { icon: '', bg: 'bg-blue-500/12', text: 'text-blue-400' },
      trend: data.orderCountToday > 0 ? { up: true, label: `${data.orderCountToday} הזמנות` } : null,
    },
    {
      label: 'הכנסות החודש',
      value: data.revenueMonth > 0 ? formatPrice(data.revenueMonth) : '—',
      sub: data.orderCountMonth > 0 ? `${data.orderCountMonth} הזמנות החודש` : 'אין הזמנות החודש',
      Icon: CalendarIcon,
      accent: { icon: '', bg: 'bg-violet-500/12', text: 'text-violet-400' },
      trend: null,
    },
    {
      label: 'הזמנות פתוחות',
      value: String(data.openOrders),
      sub: data.openOrders > 0 ? 'ממתינות לטיפול' : 'הכל מטופל',
      Icon: OrderIcon,
      accent: {
        icon: '',
        bg: data.openOrders > 0 ? 'bg-amber-500/12' : 'bg-emerald-500/12',
        text: data.openOrders > 0 ? 'text-amber-400' : 'text-emerald-400',
      },
      trend: null,
    },
    {
      label: 'סה"כ לקוחות',
      value: String(data.totalCustomers),
      sub: data.newCustomersToday > 0 ? `+${data.newCustomersToday} הצטרפו היום` : 'ללא הצטרפויות היום',
      Icon: UsersIcon,
      accent: { icon: '', bg: 'bg-emerald-500/12', text: 'text-emerald-400' },
      trend: data.newCustomersToday > 0 ? { up: true, label: `+${data.newCustomersToday}` } : null,
    },
  ]

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-7">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--ds-text-1)] leading-tight">לוח בקרה</h1>
          <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <form onSubmit={handleSearch} className="w-full sm:w-72">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ds-text-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש הזמנה, לקוח..."
              className="w-full bg-[#0E1629] border border-white/[0.055] rounded-xl py-2 pr-9 pl-3 text-sm text-[var(--ds-text-1)] placeholder:text-[var(--ds-text-3)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
          </div>
        </form>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {kpis.map((s) => <KpiCard key={s.label} {...s} />)}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-3.5 mb-4">
        {data.avgOrderValue > 0 && (
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-500/12 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarIcon className="w-[18px] h-[18px] text-violet-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-violet-400 num leading-none">{formatPrice(data.avgOrderValue)}</p>
              <p className="text-[12px] font-semibold text-[var(--ds-text-1)] mt-0.5 leading-none">ממוצע הזמנה</p>
              <p className="text-[10px] text-[var(--ds-text-3)] mt-0.5">AOV</p>
            </div>
          </div>
        )}
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/12 rounded-xl flex items-center justify-center flex-shrink-0">
            <TargetIcon className="w-[18px] h-[18px] text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-400 num leading-none">
              {data.conversionRate > 0 ? `${data.conversionRate}%` : '—'}
            </p>
            <p className="text-[12px] font-semibold text-[var(--ds-text-1)] mt-0.5 leading-none">אחוז המרה</p>
            <p className="text-[10px] text-[var(--ds-text-3)] mt-0.5">30 יום אחרונים</p>
          </div>
        </div>
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/12 rounded-xl flex items-center justify-center flex-shrink-0">
            <CartIcon className="w-[18px] h-[18px] text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-400 num leading-none">
              {data.cartRate > 0 ? `${data.cartRate}%` : '—'}
            </p>
            <p className="text-[12px] font-semibold text-[var(--ds-text-1)] mt-0.5 leading-none">הוספה לסל</p>
            <p className="text-[10px] text-[var(--ds-text-3)] mt-0.5">מכל מבקרי מוצר</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4 mb-4">
        <h2 className="text-[12px] font-semibold text-[var(--ds-text-2)] uppercase tracking-wide mb-3">פעולות מהירות</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            מוצר חדש
          </Link>
          <Link
            href="/admin/orders?status=new"
            className="flex items-center justify-center gap-1.5 bg-white/[0.06] text-[var(--ds-text-1)] px-3 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-white/[0.09] transition-colors"
          >
            <OrderIcon className="w-3.5 h-3.5 text-[var(--ds-text-3)]" />
            {data.openOrders > 0 ? `${data.openOrders} הזמנות` : 'הזמנות'}
          </Link>
          <Link
            href="/admin/import"
            className="flex items-center justify-center gap-1.5 bg-white/[0.06] text-[var(--ds-text-1)] px-3 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-white/[0.09] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[var(--ds-text-3)]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            ייבוא מוצר
          </Link>
          <Link
            href="/admin/coupons"
            className="flex items-center justify-center gap-1.5 bg-white/[0.06] text-[var(--ds-text-1)] px-3 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-white/[0.09] transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[var(--ds-text-3)]">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            קופון הנחה
          </Link>
        </div>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent orders */}
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.055]">
            <h2 className="text-[13px] font-semibold text-[var(--ds-text-1)]">הזמנות אחרונות</h2>
            <Link href="/admin/orders" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
              הצג הכל ←
            </Link>
          </div>
          {data.recentOrders.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {data.recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.025] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--ds-text-1)]">{order.orderNumber}</p>
                    <p className="text-[11px] text-[var(--ds-text-3)] truncate">{order.customer.name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge status={order.status} />
                    <p className="text-[13px] font-bold text-[var(--ds-text-1)] num">{formatPrice(order.pricing.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-5">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-white/[0.04] border border-white/[0.055] flex items-center justify-center">
                <OrderIcon className="w-5 h-5 text-[var(--ds-text-3)]" />
              </div>
              <p className="text-[13px] font-semibold text-[var(--ds-text-2)]">אין הזמנות עדיין</p>
              <p className="text-[11px] text-[var(--ds-text-3)] mt-1">ברגע שלקוח יבצע הזמנה — היא תופיע כאן</p>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.055]">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[var(--ds-text-1)]">מלאי נמוך</h2>
              {data.lowStockProducts.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {data.lowStockProducts.length}
                </span>
              )}
            </div>
            <Link href="/admin/products" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
              כל המוצרים ←
            </Link>
          </div>
          {data.lowStockProducts.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {data.lowStockProducts.map((p) => (
                <Link
                  key={p._id}
                  href={`/admin/products/${p._id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.025] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <p className="text-[13px] text-[var(--ds-text-1)] truncate">{p.nameHe}</p>
                  </div>
                  <span className="text-[11px] bg-red-500/12 text-red-400 border border-red-500/20 font-bold px-2 py-0.5 rounded-full flex-shrink-0 num">
                    {p.inventory.quantity} יח׳
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-5">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-[var(--ds-text-2)]">המלאי תקין</p>
              <p className="text-[11px] text-[var(--ds-text-3)] mt-1">אין מוצרים עם מלאי נמוך כרגע</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
