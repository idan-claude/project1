'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface ActivityItem {
  _id: string
  type: string
  description: string
  meta: string
  time: string
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Build activity log from recent orders
    fetch('/api/admin/orders?limit=50')
      .then(r => r.json())
      .then((d: any) => {
        const orders = Array.isArray(d) ? d : (d.orders ?? [])
        const activity = orders.map((o: any) => ({
          _id: o._id,
          type: 'order',
          description: `הזמנה חדשה — ${o.orderNumber}`,
          meta: `${o.customer?.name ?? 'לקוח'} · ${formatPrice(o.pricing?.total ?? 0)}`,
          time: o.createdAt,
        }))
        setItems(activity)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const STATUS_ICONS: Record<string, string> = {
    order: '◎',
    product: '⬡',
    coupon: '◈',
    settings: '◈',
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">יומן פעילות</h1>
        <p className="text-sm text-gray-500 mt-0.5">לוג פעולות ואירועים במערכת</p>
      </div>

      <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">אין פעילות עדיין</div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map(item => (
              <div key={item._id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02]">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs">{STATUS_ICONS[item.type] ?? '◈'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-white font-medium">{item.description}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{item.meta}</p>
                </div>
                <time className="text-[11px] text-gray-700 flex-shrink-0">
                  {item.time ? new Date(item.time).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
