'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const NAV = [
  { href: '/admin', label: 'לוח בקרה', icon: '📊', exact: true },
  { href: '/admin/products', label: 'מוצרים', icon: '📦' },
  { href: '/admin/orders', label: 'הזמנות', icon: '🛍️' },
  { href: '/admin/customers', label: 'לקוחות', icon: '👥' },
  { href: '/admin/categories', label: 'קטגוריות', icon: '🗂️' },
  { href: '/admin/import', label: 'ייבוא מוצרים', icon: '⬇️' },
  { href: '/admin/settings', label: 'הגדרות', icon: '⚙️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/auth/me', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-gray-300 flex flex-col">
      <div className="px-4 py-5 border-b border-gray-800">
        <Link href="/admin" className="text-white font-bold text-lg">
          TrackIt Admin
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'
              )}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          🚪 התנתק
        </button>
      </div>
    </aside>
  )
}
