'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', street: '', city: '', zip: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name) e.name = 'שדה חובה'
    if (!form.email || !form.email.includes('@')) e.email = 'אימייל לא תקין'
    if (!form.phone) e.phone = 'שדה חובה'
    if (!form.street) e.street = 'שדה חובה'
    if (!form.city) e.city = 'שדה חובה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone },
          shippingAddress: { street: form.street, city: form.city, zip: form.zip },
          items: items.map((i) => ({
            productId: i.productId,
            nameHe: i.nameHe,
            variantLabel: i.variantLabel,
            quantity: i.quantity,
          })),
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'שגיאה ביצירת הזמנה')

      // 2. Initiate payment
      const payRes = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.orderId }),
      })

      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error || 'שגיאה בתשלום')

      clearCart()
      // Redirect to Cardcom payment page
      window.location.href = payData.redirectUrl
    } catch (err: unknown) {
      alert((err as Error).message || 'אירעה שגיאה, נסה שוב')
      setLoading(false)
    }
  }

  const shipping = total() >= 30000 ? 0 : 2500
  const orderTotal = total() + shipping

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 text-lg">הסל שלך ריק</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-8">תשלום</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Form */}
        <div className="space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">פרטים אישיים</h2>
          <Input label="שם מלא" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} error={errors.name} required />
          <Input label="אימייל" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} error={errors.email} required />
          <Input label="טלפון" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} error={errors.phone} placeholder="05X-XXXXXXX" required />

          <h2 className="font-semibold text-gray-900 text-lg pt-3">כתובת למשלוח</h2>
          <Input label="רחוב ומספר בית" value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} error={errors.street} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="עיר" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} error={errors.city} required />
            <Input label="מיקוד" value={form.zip} onChange={(e) => setForm((p) => ({ ...p, zip: e.target.value }))} placeholder="אופציונלי" />
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          <h2 className="font-semibold text-gray-900 text-lg mb-4">סיכום הזמנה</h2>
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantLabel}`} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.nameHe} × {item.quantity}</span>
                <span className="font-medium">{formatPrice(item.sellingPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>משלוח</span>
                <span>{shipping === 0 ? 'חינם' : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>סה"כ</span>
                <span className="text-blue-600">{formatPrice(orderTotal)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>🔒 תשלום מאובטח דרך Cardcom</p>
            <p>✅ 100 יום אחריות להחזרת כסף</p>
          </div>

          <Button type="submit" loading={loading} size="lg" className="w-full mt-6">
            המשך לתשלום
          </Button>
        </div>
      </form>
    </div>
  )
}
