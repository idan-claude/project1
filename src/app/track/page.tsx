'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils/formatPrice'

interface OrderResult {
  orderNumber: string
  status: string
  paymentStatus: string
  createdAt: string
  trackingNumber: string
  items: { nameHe: string; quantity: number; totalPrice: number }[]
  pricing: { total: number; shippingCost: number }
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrderResult | null>(null)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch(
      `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`
    )
    const data = await res.json()

    if (!res.ok || !data.order) {
      setError('לא נמצאה הזמנה עם הפרטים שהזנת. בדוק את מספר ההזמנה והאימייל ונסה שוב.')
    } else {
      setResult(data.order)
    }
    setLoading(false)
  }

  const STATUS_STEPS = ['new', 'processing', 'shipped', 'delivered']

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

          <div className="text-center mb-10">
            <div className="text-5xl mb-4">📦</div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">מעקב הזמנה</h1>
            <p className="text-gray-500">הזן את מספר ההזמנה והאימייל שלך לצפייה בסטטוס</p>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-8 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <Input
                label="מספר הזמנה"
                placeholder="לדוגמה: ORD-2026-12345"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
              />
              <Input
                label="אימייל"
                type="email"
                placeholder="האימייל שהזנת בעת ההזמנה"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" loading={loading} size="lg" className="w-full">
                חפש הזמנה
              </Button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-blue-600 text-white px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">מספר הזמנה</p>
                    <p className="text-xl font-bold">{result.orderNumber}</p>
                  </div>
                  <Badge status={result.status} />
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Progress stepper */}
                {result.status !== 'cancelled' && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-4">מצב ההזמנה:</p>
                    <div className="flex items-center gap-0">
                      {STATUS_STEPS.map((step, i) => {
                        const stepLabels: Record<string, string> = {
                          new: 'התקבלה',
                          processing: 'בטיפול',
                          shipped: 'נשלחה',
                          delivered: 'הגיעה',
                        }
                        const currentIdx = STATUS_STEPS.indexOf(result.status)
                        const done = i <= currentIdx
                        const active = i === currentIdx

                        return (
                          <div key={step} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                done ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'
                              } ${active ? 'ring-4 ring-blue-100' : ''}`}>
                                {done ? '✓' : i + 1}
                              </div>
                              <span className={`text-xs font-medium ${done ? 'text-blue-600' : 'text-gray-400'}`}>
                                {stepLabels[step]}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tracking number */}
                {result.trackingNumber && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-green-800 mb-1">מספר מעקב משלוח:</p>
                    <p className="text-lg font-bold text-green-700">{result.trackingNumber}</p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">פרטי הזמנה:</p>
                  <div className="space-y-2">
                    {result.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
                        <span className="text-gray-700">{item.nameHe} × {item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-base mt-3 pt-3 border-t">
                    <span>סה"כ ששולם</span>
                    <span className="text-blue-600">{formatPrice(result.pricing.total)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  תאריך הזמנה: {new Date(result.createdAt).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-8">
            יש שאלות?{' '}
            <Link href="/" className="text-blue-600 hover:underline">חזור לדף הבית</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
