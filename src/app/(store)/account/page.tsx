import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'
import Order from '@/lib/db/models/Order'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/account/login')

  await connectDB()
  const userId = (session.user as { id: string }).id
  const [user, recentOrders] = await Promise.all([
    User.findById(userId, '-passwordHash').lean(),
    Order.find({ 'customer.userId': userId }).sort({ createdAt: -1 }).limit(3).lean(),
  ])

  if (!user) redirect('/account/login')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">החשבון שלי</h1>

      {/* User info card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/account/orders"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-blue-400 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">ההזמנות שלי</p>
              <p className="text-xs text-gray-500 mt-0.5">מעקב ועדכוני משלוח</p>
            </div>
          </div>
        </Link>

        <Link href="/track"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-blue-400 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">מעקב הזמנה</p>
              <p className="text-xs text-gray-500 mt-0.5">הזן מספר הזמנה</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">הזמנות אחרונות</h2>
            <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">כל ההזמנות</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const o = order as { _id: { toString: () => string }; orderNumber?: string; status: string; total: number; createdAt: Date }
              return (
                <div key={o._id.toString()} className="flex items-center justify-between py-3 border-t border-gray-100 first:border-0 first:pt-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">הזמנה #{o.orderNumber || o._id.toString().slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(o.createdAt).toLocaleDateString('he-IL')}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">₪{o.total?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.status === 'shipped'   ? 'bg-blue-100 text-blue-700' :
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {o.status === 'delivered' ? 'נמסר' :
                       o.status === 'shipped'   ? 'נשלח' :
                       o.status === 'cancelled' ? 'בוטל' :
                       o.status === 'processing' ? 'בטיפול' : 'ממתין'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recentOrders.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">עדיין לא ביצעת הזמנות</p>
          <Link href="/" className="inline-block mt-3 text-sm text-blue-600 font-medium hover:underline">לקניות</Link>
        </div>
      )}
    </div>
  )
}
