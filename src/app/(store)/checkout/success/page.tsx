'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<{ status: string; orderNumber: string; total: number } | null>(null)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!orderId) return

    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      const res = await fetch(`/api/payment/verify?orderId=${orderId}`)
      const data = await res.json()

      if (data.status === 'paid') {
        setOrder(data)
        setPolling(false)
        clearInterval(interval)
      } else if (attempts > 12) {
        setPolling(false)
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [orderId])

  if (polling) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">מעבד את התשלום...</p>
      </div>
    )
  }

  return (
    <div className="text-center py-20 px-4">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">תודה על הרכישה!</h1>
      {order ? (
        <>
          <p className="text-gray-600 mb-2">הזמנה מספר <strong>{order.orderNumber}</strong> התקבלה בהצלחה.</p>
          <p className="text-gray-600 mb-8">שלחנו לך אימייל עם פרטי ההזמנה. סכום שחויב: <strong>{formatPrice(order.total)}</strong></p>
        </>
      ) : (
        <p className="text-gray-600 mb-8">אם ביצעת תשלום, ההזמנה שלך בטיפול. קבלת אימייל אישור בקרוב.</p>
      )}
      <Link href="/" className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-block">
        חזרה לחנות
      </Link>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
