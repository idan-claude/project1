import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProductGrid from '@/components/product/ProductGrid'

async function getFeaturedProducts() {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/products?featured=true&limit=8`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.products || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
              🎉 מבצע מיוחד — קנה 2, קבל 1 חינם
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
              לעולם אל תאבד<br className="hidden md:block" /> את מה שחשוב לך
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              עוקבי מיקום חכמים תואמי Apple Find My. מצא את הארנק, המפתחות, תיק הגב ועוד — תמיד.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products" className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors text-lg">
                גלה את המוצרים
              </Link>
              <Link href="/products?category=bundles" className="border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-lg">
                ראה חבילות
              </Link>
            </div>
          </div>
        </section>

        {/* Features strip */}
        <section className="border-b bg-gray-50 py-8 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm">
            {[
              { icon: '📡', title: 'מעקב חלק', sub: 'תואם Apple Find My' },
              { icon: '🔊', title: 'התראות קוליות', sub: 'מצא בשניות' },
              { icon: '🔋', title: 'נטענת ועמידה', sub: 'טעינה אלחוטית' },
              { icon: '💳', title: 'דק כמו כרטיס', sub: 'נכנס לכל ארנק' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{icon}</span>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-gray-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        {featured.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">מוצרים מובחרים</h2>
              <Link href="/products" className="text-blue-600 text-sm font-medium hover:underline">
                כל המוצרים ←
              </Link>
            </div>
            <ProductGrid products={featured} />
          </section>
        )}

        {/* Guarantee strip */}
        <section className="bg-blue-600 text-white py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">100 יום אחריות להחזרת כסף</h2>
            <p className="text-blue-100">לא מרוצה? אנחנו נחזיר לך את הכסף — ללא שאלות. זה פשוט כך.</p>
          </div>
        </section>

        {/* Reviews */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">מה הלקוחות שלנו אומרים</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'דנה כ.', text: 'מצאתי את הארנק שלי תוך שניות! המוצר שינה את חיי. ממליצה בחום!' },
              { name: 'אבי מ.', text: 'קניתי חבילה משפחתית — לכל ילד אחד. שקט נפשי אמיתי.' },
              { name: 'שירה ל.', text: 'עיצוב דק ואלגנטי, נכנס לארנק בצורה מושלמת. עובד מצוין!' },
            ].map(({ name, text }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex mb-3">
                  {'★★★★★'.split('').map((s, i) => <span key={i} className="text-yellow-400 text-lg">{s}</span>)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{text}"</p>
                <p className="font-semibold text-sm text-gray-900">{name}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
