'use client'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetch('/api/admin/dashboard').then((r) => r.json()).then(setData)
  }, [])

  if (!data) {
    return <div className="p-8 text-gray-500 animate-pulse">טוען נתונים...</div>
  }

  const stats = [
    { label: 'הכנסה היום', value: formatPrice(data.revenueToday), sub: `${data.orderCountToday} הזמנות` },
    { label: 'הכנסה החודש', value: formatPrice(data.revenueMonth), sub: `${data.orderCountMonth} הזמנות` },
    { label: 'הזמנות פתוחות', value: data.openOrders, sub: 'ממתינות לטיפול' },
    { label: 'לקוחות רשומים', value: data.totalCustomers, sub: 'בסה"כ' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">לוח בקרה</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">הזמנות אחרונות</h2>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">כל ההזמנות</Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <Link key={order._id} href={`/admin/orders/${order._id}`} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.customer.name}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{formatPrice(order.pricing.total)}</p>
                  <Badge status={order.status} />
                </div>
              </Link>
            ))}
            {data.recentOrders.length === 0 && <p className="text-sm text-gray-400 text-center py-4">אין הזמנות עדיין</p>}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">מלאי נמוך</h2>
            <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">כל המוצרים</Link>
          </div>
          <div className="space-y-3">
            {data.lowStockProducts.map((p) => (
              <Link key={p._id} href={`/admin/products/${p._id}`} className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                <p className="text-sm text-gray-900">{p.nameHe}</p>
                <span className="text-sm font-bold text-red-600">{p.inventory.quantity} יח'</span>
              </Link>
            ))}
            {data.lowStockProducts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">המלאי תקין</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + הוסף מוצר
        </Link>
        <Link href="/admin/import" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
          ייבא מ-AliExpress
        </Link>
      </div>
    </div>
  )
}
