'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const STATUSES = ['new', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_LABELS: Record<string, string> = { new: 'חדש', processing: 'בטיפול', shipped: 'נשלח', delivered: 'הושלם', cancelled: 'בוטל' }

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`).then((r) => r.json()).then((d) => {
      setOrder(d.order)
      setStatus(d.order.status)
      setTrackingNumber(d.order.trackingNumber || '')
      setNotes(d.order.notes || '')
    })
  }, [id])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingNumber, notes }),
    })
    setSaving(false)
  }

  if (!order) return <div className="p-8 text-gray-400 animate-pulse">טוען...</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">הזמנה {order.orderNumber}</h1>
        <Badge status={order.payment?.status || 'pending'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">פרטי לקוח</h2>
          <p className="text-sm text-gray-700">{order.customer?.name}</p>
          <p className="text-sm text-gray-500">{order.customer?.email}</p>
          <p className="text-sm text-gray-500">{order.customer?.phone}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">כתובת משלוח</h2>
          <p className="text-sm text-gray-700">{order.shippingAddress?.street}</p>
          <p className="text-sm text-gray-500">{order.shippingAddress?.city} {order.shippingAddress?.zip}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">מוצרים</h2>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item._id} className="flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.nameHe}</p>
                {item.variantLabel && <p className="text-gray-500 text-xs">{item.variantLabel}</p>}
                <p className="text-gray-500 text-xs">כמות: {item.quantity}</p>
              </div>
              <p className="font-bold">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>משלוח</span>
              <span>{formatPrice(order.pricing?.shippingCost || 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>סה"כ</span>
              <span className="text-blue-600">{formatPrice(order.pricing?.total || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">עדכון הזמנה</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">סטטוס</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <Input label="מספר מעקב משלוח" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="אופציונלי" />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">הערות פנימיות</label>
          <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button loading={saving} onClick={handleSave}>שמור שינויים</Button>
      </div>
    </div>
  )
}
