'use client'
import Link from 'next/link'

const INTEGRATIONS = [
  { name: 'Cardcom', desc: 'שער תשלומים ישראלי — כרטיסי אשראי', icon: '💳', status: 'pending', href: '/admin/settings' },
  { name: 'Twilio', desc: 'שליחת WhatsApp ו-SMS ללקוחות', icon: '📱', status: 'pending', href: '/admin/settings' },
  { name: 'Cloudinary', desc: 'אחסון ועיבוד תמונות', icon: '🖼️', status: 'pending', href: '/admin/settings' },
  { name: 'AliExpress', desc: 'ייבוא מוצרים מ-AliExpress', icon: '📦', status: 'pending', href: '/admin/import' },
  { name: 'SMTP Email', desc: 'שליחת מיילים ללקוחות (Gmail/Mailgun)', icon: '📧', status: 'pending', href: '/admin/settings' },
  { name: 'Google Analytics', desc: 'מעקב ביקורים ומשפכי המרה', icon: '📊', status: 'soon', href: '#' },
  { name: 'Facebook Pixel', desc: 'פרסום ממוקד ברשתות חברתיות', icon: '📣', status: 'soon', href: '#' },
  { name: 'Meshulam', desc: 'שער תשלומים חלופי', icon: '💰', status: 'soon', href: '#' },
]

const STATUS_DISPLAY: Record<string, { label: string; cls: string }> = {
  active: { label: 'מחובר', cls: 'text-emerald-400 border-emerald-400/30' },
  pending: { label: 'ממתין לחיבור', cls: 'text-amber-400 border-amber-400/30' },
  soon: { label: 'בקרוב', cls: 'text-gray-600 border-gray-600/30' },
}

export default function IntegrationsPage() {
  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">אינטגרציות</h1>
        <p className="text-sm text-gray-500 mt-0.5">חיבור לשירותים ופלטפורמות חיצוניות</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTEGRATIONS.map(item => {
          const st = STATUS_DISPLAY[item.status]
          return (
            <Link key={item.name} href={item.href}
              className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:border-white/10 transition-colors">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">{item.desc}</p>
              </div>
              <span className={`text-[10px] border px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>{st.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
