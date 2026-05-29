import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-3">
              <span className="text-blue-400 font-black text-xl">Find</span><span className="text-white font-black text-xl">Card</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              כרטיס מעקב חכם תואם Apple Find My. מצא את הארנק, המפתחות, התיק ועוד — תמיד.
            </p>
            {/* Social links placeholder */}
            <div className="flex gap-3">
              <span className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-sm" title="Instagram">📸</span>
              <span className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-sm" title="TikTok">🎵</span>
              <span className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-sm" title="WhatsApp">💬</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-3">ניווט</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">בית</Link></li>
              <li><Link href="/product" className="hover:text-white transition-colors">המוצר שלנו</Link></li>
              <li><Link href="/track" className="hover:text-white transition-colors">מעקב הזמנה</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">צרו קשר</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-white font-semibold mb-3">מדיניות</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/policies/return" className="hover:text-white transition-colors">מדיניות החזרות ואחריות</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-white transition-colors">מדיניות משלוח</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-white transition-colors">מדיניות פרטיות</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">שירות לקוחות</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span>🛡️</span>
                <span>אחריות לכל החיים</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🚚</span>
                <span>משלוח חינם על כל הזמנה</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📧</span>
                <a href="mailto:findcardsupport@gmail.com" className="hover:text-white transition-colors break-all">
                  findcardsupport@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span>📞</span>
                <a href="tel:+9720525884463" className="hover:text-white transition-colors">
                  +972 052-588-4463
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} FindCard. כל הזכויות שמורות.</p>
          <div className="flex gap-4">
            <Link href="/policies/privacy" className="hover:text-white transition-colors">פרטיות</Link>
            <Link href="/policies/return" className="hover:text-white transition-colors">אחריות</Link>
            <Link href="/policies/shipping" className="hover:text-white transition-colors">משלוח</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
