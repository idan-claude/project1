'use client'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { track, trackPageView, getAttributionData } from '@/lib/tracking/tracker'
import type { ICheckoutConfig, IHeaderConfig } from '@/lib/db/models/StoreTheme'

const WA_NUMBER = '9720525884463'

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <path d="M16 8h4l3 5v3h-7V8z"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  )
}

function VisaIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto">
      <rect width="38" height="24" rx="3" fill="#1A1F71"/>
      <path d="M15.8 7.6l-2.3 8.8h-2.2l2.3-8.8h2.2zm9.2 5.7l1.1-3.1.7 3.1h-1.8zm2.4 3.1h2l-1.7-8.8h-1.8c-.4 0-.7.2-.9.6l-3.1 8.2h2.2l.4-1.2h2.7l.2 1.2zm-5.4-3c0 2.2-3.1 2.3-4.4 2.3l.3-1.5c1.3 0 3.1-.1 3.1-1.3 0-.8-1-.9-1.7-.9l-.3-1.4c1.5 0 3 .6 3 2.8zm-9.5-5.8c-.5-.2-1.4-.4-2.4-.4-2.6 0-4.5 1.4-4.5 3.4 0 1.5 1.3 2.3 2.4 2.8 1.1.5 1.4.8 1.4 1.3 0 .7-.8 1-1.6 1-.9 0-2-.2-2.7-.6l-.4 1.6c.8.4 2.2.7 3.2.7 2.8 0 4.6-1.4 4.6-3.5 0-1.7-1-2.4-2.3-3-.9-.4-1.5-.8-1.5-1.3 0-.5.6-1 1.5-1 .9 0 1.7.2 2.2.4l.1-1.4z" fill="#fff"/>
    </svg>
  )
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto">
      <rect width="38" height="24" rx="3" fill="#252525"/>
      <circle cx="15" cy="12" r="7" fill="#EB001B"/>
      <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
      <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/>
    </svg>
  )
}

function AmexIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto">
      <rect width="38" height="24" rx="3" fill="#2557D6"/>
      <text x="19" y="16" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">AMEX</text>
    </svg>
  )
}

interface CheckoutClientProps {
  checkoutConfig: ICheckoutConfig
  headerConfig?: IHeaderConfig
  logoUrl?: string
  storeName?: string
}

export default function CheckoutClient({ checkoutConfig, headerConfig, logoUrl, storeName }: CheckoutClientProps) {
  const { items, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', street: '', city: '', zip: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  useEffect(() => {
    trackPageView()
    track('checkout_start', { items: items.length })
  }, [])

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
      const attribution = getAttributionData()
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone },
          shippingAddress: { street: form.street, city: form.city, zip: form.zip },
          items: items.map(i => ({ productId: i.productId, nameHe: i.nameHe, variantLabel: i.variantLabel, quantity: i.quantity })),
          couponCode: couponApplied?.code ?? undefined,
          attribution,
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
        <Header headerConfig={headerConfig} logoUrl={logoUrl} storeName={storeName} />
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
      <Header headerConfig={headerConfig} logoUrl={logoUrl} storeName={storeName} />

      {/* Secure checkout band */}
      <div className="bg-white border-b border-gray-100 py-2 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2 text-gray-500 text-[11px]">
          <span className="text-green-600"><LockIcon /></span>
          <span className="font-semibold text-gray-700">תשלום מאובטח</span>
          <span className="text-gray-300">·</span>
          <span>{checkoutConfig.securityText}</span>
          {checkoutConfig.showPaymentIcons && (
            <>
              <span className="text-gray-300 mx-1">·</span>
              <div className="flex items-center gap-1.5">
                <VisaIcon />
                <MastercardIcon />
                <AmexIcon />
              </div>
            </>
          )}
        </div>
      </div>

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

            {/* Coupon code */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-sm">🏷️</span>
                קוד קופון (אופציונלי)
              </h2>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-green-700 font-bold text-sm">קופון {couponApplied.code} הופעל!</p>
                    <p className="text-green-600 text-xs">חסכת {formatPrice(couponApplied.discount)}</p>
                  </div>
                  <button type="button" onClick={() => { setCouponApplied(null); setCouponCode('') }}
                    className="text-red-500 text-xs font-semibold hover:underline">הסר</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                    placeholder="הכנס קוד קופון"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                    className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors">
                    {couponLoading ? '...' : 'החל'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-base mb-5 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">💳</span>
                שיטת תשלום
              </h2>

              {checkoutConfig.showPaymentIcons && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                  <span className="text-[11px] text-gray-400 ml-1">מתקבל:</span>
                  <VisaIcon />
                  <MastercardIcon />
                  <AmexIcon />
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg transition-colors flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <><span className="animate-spin">⏳</span> מעבד...</>
                  ) : (
                    <><span className="text-green-300"><LockIcon /></span> תשלום מאובטח — {formatPrice(orderTotal)}</>
                  )}
                </button>

                {/* Inline security reassurance */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                  <span className="text-green-500"><ShieldIcon /></span>
                  <span>מוגן ע"י הצפנת SSL 256-bit · Cardcom PCI-DSS</span>
                </div>

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
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>הנחת קופון ({couponApplied.code})</span>
                    <span className="font-semibold">−{formatPrice(couponApplied.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-lg border-t pt-2 mt-2">
                  <span>סה"כ לתשלום</span>
                  <span className="text-blue-700">{formatPrice(orderTotal)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-5 space-y-2">
                {checkoutConfig.showSslBadge && (
                  <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                    <span className="text-green-600 flex-shrink-0"><LockIcon /></span>
                    <div>
                      <p className="text-[11px] font-semibold text-green-800">תשלום מאובטח SSL</p>
                      <p className="text-[10px] text-green-600">{checkoutConfig.securityText}</p>
                    </div>
                  </div>
                )}
                {checkoutConfig.showGuaranteeBadge && (
                  <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                    <span className="text-blue-600 flex-shrink-0"><ShieldIcon /></span>
                    <p className="text-[11px] font-semibold text-blue-800">{checkoutConfig.guaranteeText}</p>
                  </div>
                )}
                {checkoutConfig.showReturnBadge && (
                  <div className="flex items-center gap-2.5 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5">
                    <span className="text-purple-600 flex-shrink-0"><RefreshIcon /></span>
                    <p className="text-[11px] font-semibold text-purple-800">{checkoutConfig.returnText}</p>
                  </div>
                )}
                {checkoutConfig.showShippingBadge && (
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                    <span className="text-gray-500 flex-shrink-0"><TruckIcon /></span>
                    <p className="text-[11px] font-semibold text-gray-700">{checkoutConfig.shippingText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  )
}
