import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-blue-400 font-black text-lg">Find</span>
              <span className="text-white font-black text-lg">Card</span>
            </div>
            <p className="text-sm leading-relaxed">כרטיס מעקב חכם תואם Apple Find My. מצא את הארנק, המפתחות, התיק ועוד — תמיד.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">ניווט</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">בית</Link></li>
              <li><Link href="/product" className="hover:text-white transition-colors">המוצר שלנו</Link></li>
              <li><Link href="/track" className="hover:text-white transition-colors">מעקב הזמנה</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">שירות לקוחות</h4>
            <ul className="space-y-2 text-sm">
              <li>100 יום אחריות להחזרת כסף</li>
              <li>משלוח חינם מעל ₪300</li>
              <li>תשלום מאובטח</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-xs">
          © {new Date().getFullYear()} FindCard. כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  )
}
