import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import Link from 'next/link'

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        שלום, {session?.user?.name}!
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/account/orders" className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
          <h2 className="font-semibold text-gray-900 mb-1">ההזמנות שלי</h2>
          <p className="text-sm text-gray-500">צפה בכל ההזמנות שביצעת</p>
        </Link>
        <Link href="/account/profile" className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
          <h2 className="font-semibold text-gray-900 mb-1">הפרופיל שלי</h2>
          <p className="text-sm text-gray-500">עדכן פרטים אישיים וכתובות</p>
        </Link>
      </div>
    </div>
  )
}
