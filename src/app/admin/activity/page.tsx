'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface ActivityItem {
  _id: string
  type: string
  description: string
  meta?: string
  ip?: string
  time: string
  source: 'audit' | 'order'
}

const TYPE_ICONS: Record<string, string> = {
  order: '◎',
  login_success: '🔐',
  login_fail: '⚠️',
  product_create: '⬡',
  product_update: '⬡',
  coupon_create: '◈',
  settings_update: '◈',
  review_update: '★',
  admin_action: '◈',
}
const TYPE_COLORS: Record<string, string> = {
  order: 'bg-blue-500/15 text-blue-400',
  login_success: 'bg-emerald-500/15 text-emerald-400',
  login_fail: 'bg-red-500/15 text-red-400',
  product_create: 'bg-violet-500/15 text-violet-400',
  product_update: 'bg-violet-500/15 text-violet-400',
  coupon_create: 'bg-amber-500/15 text-amber-400',
  settings_update: 'bg-gray-500/15 text-gray-400',
  review_update: 'bg-yellow-500/15 text-yellow-400',
  admin_action: 'bg-gray-500/15 text-gray-400',
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/audit-log?limit=30').then(r => r.json()),
      fetch('/api/admin/orders?limit=20').then(r => r.json()),
    ]).then(([auditData, ordersData]) => {
      const auditItems: ActivityItem[] = (auditData.logs ?? []).map((l: any) => ({
        _id: l._id,
        type: l.type,
        description: l.description,
        ip: l.ip,
        time: l.createdAt,
        source: 'audit',
      }))

      const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders ?? [])
      const orderItems: ActivityItem[] = orders.map((o: any) => ({
        _id: o._id,
        type: 'order',
        description: `הזמנה חדשה — ${o.orderNumber}`,
        meta: `${o.customer?.name ?? 'לקוח'} · ${formatPrice(o.pricing?.total ?? 0)}`,
        time: o.createdAt,
        source: 'order',
      }))

      const all = [...auditItems, ...orderItems]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 60)

      setItems(all)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">יומן פעילות</h1>
        <p className="text-sm text-gray-500 mt-0.5">לוג הזמנות ופעולות מנהל בזמן אמת</p>
      </div>

      <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">אין פעילות עדיין</div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map(item => {
              const icon = TYPE_ICONS[item.type] ?? '◈'
              const color = TYPE_COLORS[item.type] ?? 'bg-gray-500/15 text-gray-400'
              return (
                <div key={item._id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02]">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${color}`}>
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white font-medium">{item.description}</p>
                    {item.meta && <p className="text-[11px] text-gray-600 mt-0.5">{item.meta}</p>}
                    {item.ip && <p className="text-[10px] text-gray-700 mt-0.5">IP: {item.ip}</p>}
                  </div>
                  <time className="text-[11px] text-gray-700 flex-shrink-0">
                    {item.time ? new Date(item.time).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </time>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
