'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const NAV_MAIN = [
  { href: '/admin', label: 'לוח בקרה', icon: '📊', exact: true },
  { href: '/admin/orders', label: 'הזמנות', icon: '🛍️' },
  { href: '/admin/products', label: 'מוצרים', icon: '📦' },
  { href: '/admin/customers', label: 'לקוחות', icon: '👥' },
  { href: '/admin/reviews', label: 'ביקורות', icon: '⭐' },
  { href: '/admin/coupons', label: 'קופונים', icon: '🎟️' },
  { href: '/admin/reports', label: 'דוחות', icon: '📈' },
]

const NAV_STORE = [
  { href: '/admin/settings', label: 'ניהול החנות', icon: '⚙️' },
  { href: '/admin/payments', label: 'תשלומים', icon: '💳' },
  { href: '/admin/invoices', label: 'חשבוניות', icon: '🧾' },
  { href: '/admin/whatsapp', label: 'וואטסאפ', icon: '💬' },
  { href: '/admin/import', label: 'ייבוא מוצרים', icon: '⬇️' },
]

interface Props {
  onClose?: () => void
}

export default function AdminSidebar({ onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/auth/me', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <aside className="w-60 h-full min-h-screen bg-[#0F172A] text-gray-300 flex flex-col border-l border-gray-800/50 overflow-y-auto">
      {/* Logo + close (mobile) */}
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">FC</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">FindCard</p>
            <p className="text-gray-500 text-xs">פאנל ניהול</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 lg:hidden" aria-label="סגור תפריט">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3">
        <p className="text-xs text-gray-600 font-semibold px-2 mb-2 uppercase tracking-wider">ניהול</p>
        <div className="space-y-0.5">
          {NAV_MAIN.map(({ href, label, icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        <p className="text-xs text-gray-600 font-semibold px-2 mb-2 mt-5 uppercase tracking-wider">חנות</p>
        <div className="space-y-0.5">
          {NAV_STORE.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-gray-800 pt-3 space-y-1 flex-shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <span className="text-base w-5 text-center">🌐</span>
          <span>צפה באתר</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <span className="text-base w-5 text-center">🚪</span>
          <span>התנתק</span>
        </button>
      </div>
    </aside>
  )
}
