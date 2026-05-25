'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const NAV = [
  {
    group: 'ראשי',
    items: [
      { href: '/admin', label: 'לוח בקרה', icon: '◈', sub: 'סקירת ביצועים', exact: true },
      { href: '/admin/orders', label: 'הזמנות', icon: '◎', sub: 'ניהול וטיפול' },
      { href: '/admin/products', label: 'מוצרים', icon: '⬡', sub: 'קטלוג וניהול' },
      { href: '/admin/inventory', label: 'מלאי', icon: '▤', sub: 'מעקב כמויות' },
      { href: '/admin/customers', label: 'לקוחות', icon: '◉', sub: 'רשימה ופרטים' },
      { href: '/admin/crm', label: 'CRM', icon: '◈', sub: 'קשרי לקוחות' },
    ],
  },
  {
    group: 'שיווק ומכירות',
    items: [
      { href: '/admin/marketing', label: 'שיווק', icon: '◆', sub: 'קופונים וקמפיינים' },
      { href: '/admin/campaigns', label: 'קמפיינים', icon: '✉', sub: 'מיילים שיווקיים' },
      { href: '/admin/funnels', label: 'משפכים', icon: '▽', sub: 'ניתוח המרות' },
      { href: '/admin/automations', label: 'אוטומציות', icon: '⟳', sub: 'תזרים אוטומטי' },
      { href: '/admin/whatsapp', label: 'וואטסאפ', icon: '◌', sub: 'תבניות הודעות' },
    ],
  },
  {
    group: 'נתונים ואנליטיקה',
    items: [
      { href: '/admin/analytics', label: 'אנליטיקה', icon: '▲', sub: 'ביצועים וטרנדים' },
      { href: '/admin/ai-insights', label: 'תובנות AI', icon: '✦', sub: 'המלצות חכמות' },
      { href: '/admin/reports', label: 'דוחות', icon: '◧', sub: 'גרפים ונתונים' },
      { href: '/admin/activity', label: 'יומן פעילות', icon: '◑', sub: 'לוג פעולות' },
    ],
  },
  {
    group: 'פיננסים',
    items: [
      { href: '/admin/finance', label: 'פיננסים', icon: '◈', sub: 'הכנסות ודוחות' },
      { href: '/admin/payments', label: 'תשלומים', icon: '◎', sub: 'עסקאות Cardcom' },
      { href: '/admin/invoices', label: 'חשבוניות', icon: '◧', sub: 'מסמכים כספיים' },
    ],
  },
  {
    group: 'מערכת',
    items: [
      { href: '/admin/security', label: 'אבטחה', icon: '⬡', sub: 'IP, כניסות, הרשאות' },
      { href: '/admin/integrations', label: 'אינטגרציות', icon: '◌', sub: 'חיבורים חיצוניים' },
      { href: '/admin/team', label: 'צוות', icon: '◉', sub: 'משתמשים והרשאות' },
      { href: '/admin/settings', label: 'הגדרות חנות', icon: '◈', sub: 'הגדרות מלאות' },
    ],
  },
]

interface Props { onClose?: () => void }

export default function AdminSidebar({ onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/auth/me', { method: 'DELETE' })
    router.push('/admin/login')
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-56 h-full min-h-screen bg-[#0B0F1A] text-gray-400 flex flex-col overflow-y-auto border-l border-white/5">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-black tracking-tight">FC</div>
          <div>
            <p className="text-white font-bold text-sm leading-none">FindCard</p>
            <p className="text-gray-600 text-[10px] mt-0.5">ניהול חנות</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-600 hover:text-white p-1 lg:hidden">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ group, items }) => (
          <div key={group} className="mb-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-4 mb-1">{group}</p>
            <div className="space-y-0.5 px-2">
              {items.map(({ href, label, icon, sub, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
                      active
                        ? 'bg-blue-500/15 text-white'
                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
                    )}
                  >
                    <span className={cn(
                      'text-xs w-4 text-center flex-shrink-0 transition-colors',
                      active ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-400'
                    )}>{icon}</span>
                    <div className="min-w-0">
                      <p className={cn('font-medium leading-none text-[13px]', active ? 'text-white' : '')}>{label}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5 leading-none truncate">{sub}</p>
                    </div>
                    {active && <div className="mr-auto w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 border-t border-white/5 pt-3 space-y-0.5 flex-shrink-0">
        <Link href="/" target="_blank"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-gray-600 hover:bg-white/5 hover:text-gray-300 transition-all">
          <span className="text-xs w-4 text-center">↗</span>
          <span>צפה באתר</span>
        </Link>
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <span className="text-xs w-4 text-center">⎋</span>
          <span>התנתק</span>
        </button>
      </div>
    </aside>
  )
}
