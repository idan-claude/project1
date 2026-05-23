'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const PRODUCT_SLUG = 'kartis-maakav-smart-pro'

const FEATURES = [
  'דק כמו כרטיס אשראי — נכנס לכל ארנק',
  'תואם Apple Find My — ללא מנוי חודשי',
  'סוללה נטענת אלחוטית עד 6 חודשים',
  'התראה קולית חזקה בלחיצת כפתור',
  'עמיד בפני מים IP67',
  'הגדרה ראשונית תוך 30 שניות',
]

export default function ProductPage() {
  const [product, setProduct] = useState<any>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/products/${PRODUCT_SLUG}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product))
      .catch(() => {})
  }, [])

  // Fallback product data if DB not yet seeded
  const p = product || {
    _id: PRODUCT_SLUG,
    slug: PRODUCT_SLUG,
    nameHe: 'כרטיס מעקב FindCard PRO',
    descriptionHe: 'כרטיס מעקב חכם תואם Apple Find My. דק כמו כרטיס אשראי — מצא את הארנק, המפתחות וכל דבר אחר בשניות.',
    pricing: { sellingPrice: 16900, compareAtPrice: 24900 },
    images: [{ url: '', alt: 'FindCard PRO' }],
  }

  function handleAdd() {
    addItem({
      productId: p._id,
      slug: p.slug,
      nameHe: p.nameHe,
      image: p.images?.[0]?.url || '',
      sellingPrice: p.pricing.sellingPrice,
      quantity: qty,
      variantLabel: '',
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  async function handleBuyNow() {
    addItem({
      productId: p._id,
      slug: p.slug,
      nameHe: p.nameHe,
      image: p.images?.[0]?.url || '',
      sellingPrice: p.pricing.sellingPrice,
      quantity: qty,
      variantLabel: '',
    })
    router.push('/checkout')
  }

  const hasDiscount = p.pricing.compareAtPrice > p.pricing.sellingPrice
  const discount = hasDiscount
    ? Math.round((1 - p.pricing.sellingPrice / p.pricing.compareAtPrice) * 100)
    : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">בית</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">המוצר שלנו</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

            {/* Left: Image */}
            <div className="space-y-4">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-inner border border-blue-100">
                {p.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.nameHe} className="object-cover w-full h-full rounded-3xl" />
                ) : (
                  <div className="text-center">
                    <div className="text-9xl mb-4">💳</div>
                    <p className="text-blue-700 font-bold text-2xl">FindCard PRO</p>
                    <p className="text-blue-400 text-sm mt-1">כרטיס מעקב חכם</p>
                  </div>
                )}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '🛡️', text: '100 יום\nהחזר כסף' },
                  { icon: '🚚', text: 'משלוח חינם\nמ-₪300' },
                  { icon: '🔒', text: 'תשלום\nמאובטח' },
                ].map(({ icon, text }) => (
                  <div key={text} className="bg-gray-50 rounded-xl p-3 border">
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-xs text-gray-600 whitespace-pre-line font-medium">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product info */}
            <div className="space-y-6">
              <div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">במלאי ✓</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3 mb-2">
                  {p.nameHe}
                </h1>
                <p className="text-gray-500 leading-relaxed">{p.descriptionHe}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-blue-600">{formatPrice(p.pricing.sellingPrice)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{formatPrice(p.pricing.compareAtPrice)}</span>
                    <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-lg">
                      חסוך {discount}%
                    </span>
                  </>
                )}
              </div>

              {/* Features */}
              <div className="bg-blue-50 rounded-2xl p-5">
                <p className="font-bold text-gray-900 mb-3">מה כלול:</p>
                <ul className="space-y-2">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="text-blue-500 font-bold flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quantity */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">כמות:</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold flex items-center justify-center hover:bg-gray-50"
                  >−</button>
                  <span className="text-xl font-bold w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-10 rounded-xl border border-gray-300 text-xl font-bold flex items-center justify-center hover:bg-gray-50"
                  >+</button>
                  {qty >= 2 && (
                    <span className="text-sm text-green-600 font-medium">🎁 קנה 2 קבל 1 חינם!</span>
                  )}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-yellow-400 text-yellow-900 font-extrabold py-4 rounded-xl hover:bg-yellow-300 transition-colors text-lg shadow-lg"
                >
                  קנה עכשיו ←
                </button>
                <button
                  onClick={handleAdd}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg"
                >
                  {added ? '✓ נוסף לסל!' : 'הוסף לסל'}
                </button>
              </div>

              {/* Sale urgency */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                🔥 <strong>מבצע מוגבל:</strong> קנה 2 יחידות וקבל את השלישית חינם. המלאי מוגבל!
              </div>
            </div>
          </div>

          {/* Full description section */}
          <div className="mt-20 border-t pt-16">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">פרטי המוצר</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">מפרט טכני</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-200">
                    {[
                      ['גודל', '85.6 × 54 × 0.8 מ"מ'],
                      ['משקל', '7 גרם'],
                      ['סוללה', 'Li-Polymer נטענת אלחוטית'],
                      ['עמידות', 'IP67 (מים ואבק)'],
                      ['טכנולוגיה', 'Bluetooth 5.1 + Apple Find My'],
                      ['זמן טעינה', 'כ-2 שעות'],
                      ['אחריות', '100 יום החזרת כסף'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 pr-0 font-medium text-gray-700">{k}</td>
                        <td className="py-2 text-gray-600">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-blue-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">במה FindCard שונה?</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  {[
                    'הכרטיס הדק ביותר בשוק — לא תרגיש אותו בארנק',
                    'לא צריך להחליף סוללה לעולם — רק לטעון',
                    'עובד בלי אפליקציה נוספת — ישירות מ-Find My',
                    'רשת מיקום של מאות מיליוני מכשירי Apple',
                    'הגדרה מהירה — 30 שניות בלבד',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
