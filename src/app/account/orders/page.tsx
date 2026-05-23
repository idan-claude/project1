'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Badge } from '@/components/ui/Badge'

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/orders').then((r) => r.json()).then((d) => setOrders(d.orders || [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-400 animate-pulse">טוען הזמנות...</div>

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">ההזמנות שלי</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500">לא ביצעת הזמנות עדיין.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('he-IL')}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-blue-600">{formatPrice(o.pricing?.total || 0)}</p>
                  <Badge status={o.status} />
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {o.items?.map((item: any) => (
                  <p key={item._id}>{item.nameHe} × {item.quantity}</p>
                ))}
              </div>
              {o.trackingNumber && (
                <p className="mt-3 text-sm text-gray-600">
                  מעקב משלוח: <strong>{o.trackingNumber}</strong>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
