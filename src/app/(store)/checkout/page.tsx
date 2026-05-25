'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'

const WA_NUMBER = '9720525884463'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', street: '', city: '', zip: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const subtotalAmount = total()
  const orderTotal = Math.max(0, subtotalAmount - (couponApplied?.discount ?? 0))

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'שדה חובה'
    if (!form.email || !form.email.includes('@')) e.email = 'אימייל לא תקין'
    if (!form.phone.trim()) e.phone = 'שדה חובה'
    if (!form.street.trim()) e.street = 'שדה חובה'
    if (!form.city.trim()) e.city = 'שדה חובה'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: subtotalAmount }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponError(data.error || 'קוד לא תקין')
        setCouponApplied(null)
      } else {
        setCouponApplied({ code, discount: data.discount })
        setCouponError('')
      }
    } catch {
      setCouponError('שגיאה בבדיקת הקופון')
    } finally {
      setCouponLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone },
          shippingAddress: { street: form.street, city: form.city, zip: form.zip },
          items: items.map(i => ({ productId: i.productId, nameHe: i.nameHe, variantLabel: i.variantLabel, quantity: i.quantity })),
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'שגיאה ביצירת הזמנה')

      const payRes = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.orderId }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error || 'שגיאה בתשלום')

      clearCart()
      window.location.href = payData.redirectUrl
    } catch (err: unknown) {
      alert((err as Error).message || 'אירעה שגיאה, נסה שוב')
      setLoading(false)
    }
  }

  function handleWhatsApp() {
    if (!validate()) return
    const itemsText = items.map(i => `${i.nameHe} × ${i.quantity} — ${formatPrice(i.sellingPrice * i.quantity)}`).join('\n')
    const msg = encodeURIComponent(
      `שלום! אני רוצה להזמין:\n\n${itemsText}\n\nסה"כ: ${formatPrice(orderTotal)}\n\nפרטים:\nשם: ${form.name}\nאימייל: ${form.email}\nטלפון: ${form.phone}\nכתובת: ${form.street}, ${form.city}${form.zip ? ' ' + form.zip : ''}`
    )
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-gray-600 text-lg mb-6">הסל שלך ריק</p>
          <Link href="/product" className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            לרכישה ←
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
          <span className="font-semibold text-blue-600">פרטים</span>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-400 w-6 h-6 border-2 rounded-full flex items-center justify-center text-xs">2</span>
          <span className="text-gray-400">תשלום</span>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-400 w-6 h-6 border-2 rounded-full flex items-center justify-center text-xs">3</span>
          <span className="text-gray-400">אישור</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Form (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Personal details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">👤</span>
                פרטים אישיים
              </h2>
              <div className="space-y-4">
                <Input label="שם מלא" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} required placeholder="ישראל ישראלי" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="אימייל" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} error={errors.email} required placeholder="example@gmail.com" />
                  <Input label="טלפון נייד" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} error={errors.phone} placeholder="050-0000000" required />
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">📍</span>
                כתובת למשלוח
                <span className="mr-auto text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">🚚 משלוח חינם</span>
              </h2>
              <div className="space-y-4">
                <Input label="רחוב ומספר בית" value={form.street} onChange={e => setForm(p => ({ ...p, street: e.target.value }))} error={errors.street} required placeholder="רחוב הרצל 1" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="עיר" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} error={errors.city} required placeholder="תל אביב" />
                  <Input label="מיקוד (אופציונלי)" value={form.zip} onChange={e => setForm(p => ({ ...p, zip: e.target.value }))} placeholder="6200000" />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">💳</span>
                שיטת תשלום
              </h2>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg transition-colors flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <><span className="animate-spin">⏳</span> מעבד...</>
                  ) : (
                    <>🔒 תשלום בכרטיס אשראי — {formatPrice(orderTotal)}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold py-4 rounded-xl text-lg shadow-lg transition-colors flex items-center justify-center gap-3"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  הזמנה דרך WhatsApp
                </button>
                <p className="text-xs text-gray-400 text-center">תשלום ב-WhatsApp מעובד ידנית ע"י הצוות שלנו</p>
              </div>
            </div>
          </div>

          {/* Right: Order summary (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24">
              <h2 className="font-bold text-gray-900 text-base mb-5">סיכום הזמנה</h2>

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantLabel}`} className="flex justify-between text-sm gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium leading-tight truncate">{item.nameHe}</p>
                      <p className="text-gray-400 text-xs">כמות: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-gray-900 flex-shrink-0">{formatPrice(item.sellingPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>משלוח</span>
                  <span className="text-green-600 font-semibold">חינם 🎁</span>
                </div>
                <div className="flex justify-between font-extrabold text-lg border-t pt-2 mt-2">
                  <span>סה"כ לתשלום</span>
                  <span className="text-blue-700">{formatPrice(orderTotal)}</span>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span>🔒</span><span>תשלום מאובטח SSL</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span>🛡️</span><span>אחריות לכל החיים + 100 יום החזר כסף</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span>🚚</span><span>משלוח חינם · 7–14 ימי עסקים</span>
                </div>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  )
}
