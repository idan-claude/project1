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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d)
        setError(false)
      })
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
      <div className="p-8 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-gray-600 font-semibold mb-2">לא ניתן להתחבר לשרת</p>
        <button onClick={fetchData} className="text-blue-600 text-sm hover:underline">נסה שוב</button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-40" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
          </div>
          <div className="h-56 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  const kpis = [
    {
      label: 'הכנסות היום',
      value: data.revenueToday > 0 ? formatPrice(data.revenueToday) : '—',
      sub: data.orderCountToday > 0 ? `${data.orderCountToday} הזמנות` : 'אין הזמנות היום',
      icon: '💰',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'הכנסות החודש',
      value: data.revenueMonth > 0 ? formatPrice(data.revenueMonth) : '—',
      sub: data.orderCountMonth > 0 ? `${data.orderCountMonth} הזמנות` : 'אין הזמנות החודש',
      icon: '📅',
      bg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'הזמנות פתוחות',
      value: String(data.openOrders),
      sub: data.openOrders > 0 ? 'ממתינות לטיפול' : 'הכל מטופל ✓',
      icon: '⏳',
      bg: data.openOrders > 0 ? 'bg-amber-50' : 'bg-green-50',
      iconColor: data.openOrders > 0 ? 'text-amber-600' : 'text-green-600',
    },
    {
      label: 'סה"כ לקוחות',
      value: String(data.totalCustomers),
      sub: data.newCustomersToday > 0 ? `+${data.newCustomersToday} היום` : 'ללא הצטרפויות היום',
      icon: '👥',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">לוח בקרה</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <form onSubmit={handleSearch} className="w-full sm:flex-1 sm:mr-auto sm:max-w-sm">
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש הזמנה, לקוח..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center text-lg mb-3`}>{s.icon}</div>
            <p className={`text-2xl font-black mb-0.5 ${s.iconColor}`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-700">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Conversion metrics row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {data.avgOrderValue > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">📊</div>
            <div>
              <p className="text-xl font-black text-violet-600">{formatPrice(data.avgOrderValue)}</p>
              <p className="text-xs font-semibold text-gray-700">ממוצע הזמנה</p>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">🎯</div>
          <div>
            <p className="text-xl font-black text-green-600">{data.conversionRate > 0 ? `${data.conversionRate}%` : '—'}</p>
            <p className="text-xs font-semibold text-gray-700">אחוז המרה</p>
            <p className="text-xs text-gray-400">30 יום אחרונים</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">🛒</div>
          <div>
            <p className="text-xl font-black text-orange-600">{data.cartRate > 0 ? `${data.cartRate}%` : '—'}</p>
            <p className="text-xs font-semibold text-gray-700">הוספה לסל</p>
            <p className="text-xs text-gray-400">מכל מבקרי המוצר</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-5">
        <h2 className="font-bold text-gray-900 mb-3 text-sm">פעולות מהירות</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link
            href="/admin/products/new"
            className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <span>+</span> מוצר חדש
          </Link>
          <Link
            href="/admin/orders?status=new"
            className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            🔔 {data.openOrders > 0 ? `${data.openOrders} הזמנות` : 'הזמנות'}
          </Link>
          <Link
            href="/admin/import"
            className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            ⬇️ ייבוא מוצר
          </Link>
          <Link
            href="/admin/coupons"
            className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            🎟️ קופון הנחה
          </Link>
        </div>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">הזמנות אחרונות</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">כל ההזמנות ←</Link>
          </div>
          {data.recentOrders.length > 0 ? (
            <div className="space-y-1">
              {data.recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between py-2.5 px-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 truncate">{order.customer.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={order.status} />
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.pricing.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm font-semibold text-gray-500">אין הזמנות עדיין</p>
              <p className="text-xs text-gray-400 mt-1">ברגע שלקוח יבצע הזמנה — היא תופיע כאן</p>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">מלאי</h2>
            <Link href="/admin/products" className="text-xs text-blue-600 hover:underline">כל המוצרים ←</Link>
          </div>
          {data.lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              {data.lowStockProducts.map((p) => (
                <Link
                  key={p._id}
                  href={`/admin/products/${p._id}`}
                  className="flex items-center justify-between py-2.5 px-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <p className="text-sm text-gray-800 truncate">{p.nameHe}</p>
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                    {p.inventory.quantity} יחידות
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-sm font-semibold text-gray-500">המלאי תקין</p>
              <p className="text-xs text-gray-400 mt-1">אין מוצרים עם מלאי נמוך כרגע</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
