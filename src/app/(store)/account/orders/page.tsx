import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  new:        'ממתין',
  processing: 'בטיפול',
  shipped:    'נשלח',
  delivered:  'נמסר',
  cancelled:  'בוטל',
}

const STATUS_COLOR: Record<string, string> = {
  new:        'bg-gray-100 text-gray-600',
  processing: 'bg-amber-100 text-amber-700',
  shipped:    'bg-blue-100 text-blue-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
}

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/account/login')

  await connectDB()
  const userId = (session.user as { id: string }).id
  const orders = await Order.find({ 'customer.userId': userId })
    .sort({ createdAt: -1 })
    .lean()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/account" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ההזמנות שלי</h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">עדיין לא ביצעת הזמנות</p>
          <p className="text-sm text-gray-400 mt-1">הזמנות שתבצע יופיעו כאן</p>
          <Link href="/" className="inline-block mt-4 bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            לחנות
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const o = order as unknown as {
              _id: { toString: () => string }
              orderNumber: string
              status: string
              pricing: { total: number }
              items: Array<{ nameHe: string; quantity: number }>
              createdAt: Date
              trackingNumber?: string
            }
            const total = (o.pricing?.total ?? 0) / 100
            return (
              <div key={o._id.toString()} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">הזמנה #{o.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>

                {o.items?.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 mb-3 space-y-1.5">
                    {o.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-gray-600">
                        <span>{item.productName}</span>
                        <span className="text-gray-400">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">סה&quot;כ: ₪{total.toFixed(2)}</p>
                  {o.trackingNumber && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      מעקב: {o.trackingNumber}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
