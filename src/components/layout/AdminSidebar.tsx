'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

const NAV_MAIN = [
  { href: '/admin', label: 'לוח בקרה', icon: '📊', exact: true },
  { href: '/admin/orders', label: 'הזמנות', icon: '🛍️' },
  { href: '/admin/products', label: 'מוצרים', icon: '📦' },
  { href: '/admin/reviews', label: 'ביקורות', icon: '⭐' },
  { href: '/admin/customers', label: 'לקוחות', icon: '👥' },
  { href: '/admin/coupons', label: 'קופונים', icon: '🎟️' },
  { href: '/admin/abandoned-carts', label: 'עגלות נטושות', icon: '🛒' },
  { href: '/admin/reports', label: 'דוחות', icon: '📈' },
]

const NAV_STORE = [
  { href: '/admin/settings', label: 'ניהול החנות', icon: '⚙️' },
  { href: '/admin/payments', label: 'תשלומים', icon: '💳' },
  { href: '/admin/invoices', label: 'חשבוניות', icon: '🧾' },
  { href: '/admin/whatsapp', label: 'וואטסאפ', icon: '💬' },
  { href: '/admin/import', label: 'ייבוא מוצרים', icon: '⬇️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [visitors, setVisitors] = useState(Math.floor(Math.random() * 8) + 2)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisitors(Math.floor(Math.random() * 12) + 1)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  async function logout() {
    await fetch('/api/admin/auth/me', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-[#0F172A] text-gray-300 flex flex-col border-l border-gray-800/50 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">FC</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">FindCard</p>
            <p className="text-gray-500 text-xs">פאנל ניהול</p>
          </div>
        </Link>
      </div>

      {/* Live visitors */}
      <div className="mx-4 mt-4 mb-2 bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold text-green-400">LIVE</span>
          </div>
          <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">{visitors}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{visitors} גולשים באתר עכשיו</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <p className="text-xs text-gray-600 font-semibold px-2 mb-2 uppercase tracking-wider">ניהול</p>
        <div className="space-y-0.5">
          {NAV_MAIN.map(({ href, label, icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="text-base w-5 text-center">{icon}</span>
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
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom: view site + logout */}
      <div className="px-3 pb-4 border-t border-gray-800 pt-3 space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
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
