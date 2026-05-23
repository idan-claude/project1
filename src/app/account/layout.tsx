import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">
          <aside className="w-44 flex-shrink-0">
            <nav className="space-y-1">
              <Link href="/account" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">סקירה כללית</Link>
              <Link href="/account/orders" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">ההזמנות שלי</Link>
              <Link href="/account/profile" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">הפרופיל שלי</Link>
            </nav>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
