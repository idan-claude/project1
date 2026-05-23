import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">TrackIt IL</h3>
            <p className="text-sm leading-relaxed">עוקבי מיקום חכמים תואמי Apple Find My. לעולם אל תאבד את הדברים שחשובים לך.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">ניווט מהיר</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">כל המוצרים</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-white transition-colors">מוצרים מובחרים</Link></li>
              <li><Link href="/account/orders" className="hover:text-white transition-colors">ההזמנות שלי</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">שירות לקוחות</h4>
            <ul className="space-y-2 text-sm">
              <li>100 יום אחריות להחזרת כסף</li>
              <li>משלוח חינם מעל ₪300</li>
              <li>תמיכה 24/7</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs">
          © {new Date().getFullYear()} TrackIt IL. כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  )
}
