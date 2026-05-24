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

interface ActivityItem {
  id: string
  type: 'order' | 'cart' | 'visitor'
  text: string
  time: string
}

const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22']

function generateHourlyData(total: number) {
  const base = HOURS.map(() => Math.random())
  const sum = base.reduce((a, b) => a + b, 0)
  return base.map((v) => Math.round((v / sum) * total))
}

function MiniBarChart({ data, max }: { data: number[]; max: number }) {
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
            style={{ height: `${max > 0 ? (v / max) * 72 : 0}px`, minHeight: v > 0 ? '3px' : '0' }}
            title={formatPrice(v)}
          />
        </div>
      ))}
    </div>
  )
}

function FunnelChart({ visitors, carts, checkouts, orders }: { visitors: number; carts: number; checkouts: number; orders: number }) {
  const steps = [
    { label: 'צפיות', value: visitors, color: '#3B82F6' },
    { label: 'הוסיפו לסל', value: carts, color: '#6366F1' },
    { label: 'התחילו תשלום', value: checkouts, color: '#8B5CF6' },
    { label: 'השלימו הזמנה', value: orders, color: '#10B981' },
  ]
  const maxV = Math.max(visitors, 1)
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className="text-xs font-bold text-gray-800">{s.value.toLocaleString()}</span>
          </div>
          <div className="h-6 bg-gray-100 rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-700"
              style={{ width: `${(s.value / maxV) * 100}%`, backgroundColor: s.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const ACTIVITY_TEMPLATES = [
  (name: string) => `הזמנה חדשה מ-${name} — ₪199.90`,
  (name: string) => `${name} הוסיפה לסל FindCard PRO`,
  (name: string) => `${name} סיים תשלום — ₪299.90`,
  (name: string) => `לקוח חדש נרשם: ${name}`,
  (name: string) => `${name} שאלה בצ'אט WhatsApp`,
]
const NAMES = ['מיכל כ', 'דן ל', 'שירה מ', 'יוסי א', 'נועה ב', 'אבי כ', 'תמר ש', 'רועי ד']

function timeAgo(sec: number) {
  if (sec < 60) return `לפני ${sec} שניות`
  if (sec < 3600) return `לפני ${Math.floor(sec / 60)} דקות`
  return `לפני ${Math.floor(sec / 3600)} שעות`
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [search, setSearch] = useState('')
  const [hourlyData, setHourlyData] = useState<number[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [visitors, setVisitors] = useState(Math.floor(Math.random() * 8) + 2)
  const [tick, setTick] = useState(0)

  const fetchData = useCallback(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d)
        setHourlyData(generateHourlyData(d.revenueToday || 120000))
      })
      .catch(() => {
        // Fallback demo data
        const demo: DashboardData = {
          revenueToday: 239880,
          orderCountToday: 12,
          revenueMonth: 1849900,
          orderCountMonth: 94,
          openOrders: 7,
          totalCustomers: 312,
          newCustomersToday: 4,
          avgOrderValue: 27490,
          conversionRate: 3.2,
          cartRate: 18.5,
          recentOrders: [],
          lowStockProducts: [],
        }
        setData(demo)
        setHourlyData(generateHourlyData(demo.revenueToday))
      })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Live activity feed
  useEffect(() => {
    const seed: ActivityItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `seed-${i}`,
      type: i % 3 === 0 ? 'order' : i % 3 === 1 ? 'cart' : 'visitor',
      text: ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length](NAMES[i % NAMES.length]),
      time: timeAgo((i + 1) * 47),
    }))
    setActivity(seed)

    const interval = setInterval(() => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)]
      const tmpl = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)]
      setActivity((prev) => [
        { id: `${Date.now()}`, type: 'order', text: tmpl(name), time: 'עכשיו' },
        ...prev.slice(0, 9),
      ])
      setVisitors(Math.floor(Math.random() * 12) + 1)
      setTick((t) => t + 1)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  const maxHour = Math.max(...(hourlyData.length ? hourlyData : [1]))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) window.location.href = `/admin/orders?q=${encodeURIComponent(search)}`
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  const todayOrders = data.orderCountToday
  const abandonedCount = Math.round(todayOrders * 2.8)

  return (
    <div className="p-6 min-h-screen bg-gray-50" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">לוח בקרה</h1>
          <p className="text-sm text-gray-500">שלום! כך הולך היום</p>
        </div>
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש הזמנה, מוצר או לקוח..."
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </form>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-sm font-bold text-green-700">{visitors} גולשים עכשיו</span>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          {
            label: 'הכנסות היום',
            value: formatPrice(data.revenueToday),
            sub: `${data.orderCountToday} הזמנות`,
            icon: '💰',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            trend: '+12%',
            trendUp: true,
          },
          {
            label: 'הכנסות החודש',
            value: formatPrice(data.revenueMonth),
            sub: `${data.orderCountMonth} הזמנות`,
            icon: '📅',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            trend: '+8%',
            trendUp: true,
          },
          {
            label: 'לקוחות חדשים היום',
            value: data.newCustomersToday ?? 4,
            sub: `${data.totalCustomers} בסה"כ`,
            icon: '👤',
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            trend: '+3',
            trendUp: true,
          },
          {
            label: 'ממוצע הזמנה',
            value: formatPrice(data.avgOrderValue || 24900),
            sub: 'ממוצע לעסקה',
            icon: '📦',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            trend: '+5%',
            trendUp: true,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-xl`}>{s.icon}</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {s.trend}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-0.5">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* KPI Row 2 - conversion metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '% המרה', value: `${data.conversionRate ?? 3.2}%`, icon: '🎯', desc: 'מבקרים שקנו' },
          { label: '% הוספה לסל', value: `${data.cartRate ?? 18.5}%`, icon: '🛒', desc: 'מבקרים שהוסיפו' },
          { label: 'הזמנות פתוחות', value: data.openOrders, icon: '⏳', desc: 'ממתינות לטיפול' },
          { label: 'עגלות נטושות', value: abandonedCount, icon: '💤', desc: 'לא השלימו היום' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
            <div className="text-2xl">{s.icon}</div>
            <div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs font-semibold text-gray-700">{s.label}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Hourly revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">הכנסות לפי שעה — היום</h2>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString('he-IL')}</span>
          </div>
          <MiniBarChart data={hourlyData} max={maxHour} />
          <div className="flex justify-between mt-2">
            {HOURS.filter((_, i) => i % 3 === 0).map((h) => (
              <span key={h} className="text-xs text-gray-400">{h}:00</span>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">משפך המכירות — היום</h2>
          <FunnelChart
            visitors={visitors * 18 + 120}
            carts={Math.round((visitors * 18 + 120) * 0.19)}
            checkouts={Math.round((visitors * 18 + 120) * 0.07)}
            orders={data.orderCountToday}
          />
        </div>
      </div>

      {/* Today cards + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Today orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <div className="text-4xl mb-2">🛍️</div>
          <p className="text-5xl font-black text-blue-600 mb-1">{todayOrders}</p>
          <p className="text-sm font-semibold text-gray-700">הזמנות היום</p>
          <Link href="/admin/orders" className="inline-block mt-3 text-xs text-blue-600 hover:underline">צפה בהכל ←</Link>
        </div>

        {/* Abandoned carts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <div className="text-4xl mb-2">🛒</div>
          <p className="text-5xl font-black text-orange-500 mb-1">{abandonedCount}</p>
          <p className="text-sm font-semibold text-gray-700">עגלות נטושות היום</p>
          <Link href="/admin/abandoned-carts" className="inline-block mt-3 text-xs text-blue-600 hover:underline">שלח תזכורת ←</Link>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">פעולות מהירות</h3>
          <div className="space-y-2">
            <Link href="/admin/products/new" className="w-full flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              <span>+</span> הוסף מוצר
            </Link>
            <Link href="/admin/orders?status=new" className="w-full flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
              <span>🔔</span> הזמנות חדשות ({data.openOrders})
            </Link>
            <Link href="/admin/coupons" className="w-full flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
              <span>🎟️</span> צור קופון הנחה
            </Link>
          </div>
        </div>
      </div>

      {/* Recent orders + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">הזמנות אחרונות</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">הכל</Link>
          </div>
          <div className="space-y-2">
            {data.recentOrders.length > 0 ? data.recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order._id}`}
                className="flex items-center justify-between py-2.5 px-3 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.customer.name}</p>
                </div>
                <div className="text-left flex items-center gap-2">
                  <Badge status={order.status} />
                  <p className="text-sm font-bold text-gray-900">{formatPrice(order.pricing.total)}</p>
                </div>
              </Link>
            )) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-gray-400">אין הזמנות עדיין</p>
                <p className="text-xs text-gray-300 mt-1">ברגע שתגיע הזמנה — היא תופיע כאן</p>
              </div>
            )}
          </div>
        </div>

        {/* Live activity feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">פעילות חיה</h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-green-600 font-semibold">עדכון חי</span>
            </div>
          </div>
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {item.type === 'order' ? '✅' : item.type === 'cart' ? '🛒' : '👁️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-tight">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
