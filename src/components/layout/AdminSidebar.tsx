'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

/* ── SVG icon primitives ──────────────────────────────── */
type P = { className?: string }
function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={cn('w-[15px] h-[15px] flex-shrink-0', className)}>
      {children}
    </svg>
  )
}

const IGrid = (p: P) => <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></Svg>
const IHome = (p: P) => <Svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>
const IBag = (p: P) => <Svg {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></Svg>
const IBox = (p: P) => <Svg {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Svg>
const IArchive = (p: P) => <Svg {...p}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></Svg>
const IUsers = (p: P) => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>
const IHeart = (p: P) => <Svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Svg>
const IZap = (p: P) => <Svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Svg>
const IShare = (p: P) => <Svg {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Svg>
const IPlay = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></Svg>
const IMail = (p: P) => <Svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Svg>
const IFilter = (p: P) => <Svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Svg>
const IMsg = (p: P) => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>
const IBar = (p: P) => <Svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg>
const IActivity = (p: P) => <Svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>
const ITrend = (p: P) => <Svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Svg>
const IStar = (p: P) => <Svg {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></Svg>
const IFile = (p: P) => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>
const IClock = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>
const IDollar = (p: P) => <Svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Svg>
const ICard = (p: P) => <Svg {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></Svg>
const ISearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>
const IAlert = (p: P) => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const IShield = (p: P) => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>
const ILink = (p: P) => <Svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>
const IRadio = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></Svg>
const ICog = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>
const IExternal = (p: P) => <Svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></Svg>
const ILogOut = (p: P) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>

/* ── Navigation definition ────────────────────────────── */
const NAV = [
  {
    group: 'ראשי',
    items: [
      { href: '/admin/executive', label: 'Executive', Icon: IGrid,    sub: 'Command Center',      exact: true },
      { href: '/admin',          label: 'לוח בקרה',  Icon: IHome,    sub: 'סקירת ביצועים',       exact: true },
      { href: '/admin/orders',   label: 'הזמנות',    Icon: IBag,     sub: 'ניהול וטיפול' },
      { href: '/admin/products', label: 'מוצרים',    Icon: IBox,     sub: 'קטלוג וניהול' },
      { href: '/admin/inventory',label: 'מלאי',      Icon: IArchive, sub: 'מעקב כמויות' },
      { href: '/admin/customers',label: 'לקוחות',    Icon: IUsers,   sub: 'רשימה ופרטים' },
      { href: '/admin/crm',      label: 'CRM',       Icon: IHeart,   sub: 'קשרי לקוחות' },
    ],
  },
  {
    group: 'שיווק',
    items: [
      { href: '/admin/marketing',          label: 'שיווק',        Icon: IZap,    sub: 'קופונים וקמפיינים' },
      { href: '/admin/marketing/meta',     label: 'Meta Pixel',  Icon: IShare,  sub: 'Pixel + CAPI' },
      { href: '/admin/marketing/tiktok',   label: 'TikTok Pixel',Icon: IPlay,   sub: 'Pixel + Events API' },
      { href: '/admin/campaigns',          label: 'קמפיינים',     Icon: IMail,   sub: 'מיילים שיווקיים' },
      { href: '/admin/funnels',            label: 'משפכים',       Icon: IFilter, sub: 'ניתוח המרות' },
      { href: '/admin/automations',        label: 'אוטומציות',    Icon: IZap,    sub: 'תזרים אוטומטי' },
      { href: '/admin/whatsapp',           label: 'וואטסאפ',      Icon: IMsg,    sub: 'תבניות הודעות' },
    ],
  },
  {
    group: 'אנליטיקה',
    items: [
      { href: '/admin/analytics',                label: 'אנליטיקה',          Icon: IBar,      sub: 'ביצועים וטרנדים' },
      { href: '/admin/analytics/visitors',       label: 'מבקרים',             Icon: IActivity, sub: 'תנועה ומסעות' },
      { href: '/admin/products/intelligence',    label: 'Product Intelligence',Icon: ITrend,   sub: 'ביצועים לפי מוצר' },
      { href: '/admin/ai-insights',              label: 'תובנות AI',           Icon: IStar,    sub: 'המלצות חכמות' },
      { href: '/admin/reports',                  label: 'דוחות',              Icon: IFile,    sub: 'גרפים ונתונים' },
      { href: '/admin/activity',                 label: 'יומן פעילות',        Icon: IClock,   sub: 'לוג פעולות' },
    ],
  },
  {
    group: 'פיננסים',
    items: [
      { href: '/admin/finance',  label: 'פיננסים',   Icon: IDollar, sub: 'הכנסות ודוחות' },
      { href: '/admin/payments', label: 'תשלומים',   Icon: ICard,   sub: 'עסקאות וספקים' },
      { href: '/admin/invoices', label: 'חשבוניות',  Icon: IFile,   sub: 'מסמכים כספיים' },
    ],
  },
  {
    group: 'מערכת',
    items: [
      { href: '/admin/health',                   label: 'בריאות מערכת',  Icon: IActivity, sub: 'MongoDB, API, אינטגרציות' },
      { href: '/admin/system',                   label: 'בדיקת מערכת',   Icon: ISearch,   sub: 'אימות אוטומטי' },
      { href: '/admin/anomalies',                label: 'Anomaly Detection',Icon: IAlert,  sub: 'ניטור חריגות' },
      { href: '/admin/security',                 label: 'אבטחה',          Icon: IShield,  sub: 'IP, כניסות, הרשאות' },
      { href: '/admin/connections',               label: 'חיבורים',        Icon: ILink,    sub: 'כל האינטגרציות', exact: true },
      { href: '/admin/integrations',             label: 'אינטגרציות',     Icon: IRadio,   sub: 'חיבורים חיצוניים' },
      { href: '/admin/integrations/marketing',   label: 'שיווק ופיקסלים', Icon: IZap,     sub: 'Meta, TikTok, GA4, GTM' },
      { href: '/admin/team',                     label: 'צוות',           Icon: IUsers,   sub: 'משתמשים והרשאות' },
      { href: '/admin/settings',                 label: 'הגדרות חנות',    Icon: ICog,     sub: 'הגדרות מלאות' },
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
    <aside className="w-56 h-full min-h-screen bg-[#080C18] text-gray-400 flex flex-col overflow-y-auto border-l border-white/[0.055] admin-scroll">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.055] flex items-center justify-between flex-shrink-0">
        <Link href="/admin" onClick={onClose} className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white text-[11px] font-black tracking-tight">FC</div>
          <div>
            <p className="text-white font-bold text-[13px] leading-none tracking-tight">FindCard</p>
            <p className="text-[var(--ds-text-3)] text-[10px] mt-0.5 leading-none font-medium">Admin Panel</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-gray-600 hover:text-white p-1 lg:hidden transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-3 overflow-y-auto admin-scroll">
        {NAV.map(({ group, items }) => (
          <div key={group} className="mb-5">
            <p className="text-[9px] font-bold text-[var(--ds-text-3)] uppercase tracking-[0.12em] px-4 mb-1.5">{group}</p>
            <div className="space-y-0.5 px-2">
              {items.map(({ href, label, Icon, sub, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-sm transition-all duration-150 relative',
                      active
                        ? 'bg-white/[0.07] text-white'
                        : 'text-[var(--ds-text-2)] hover:bg-white/[0.04] hover:text-gray-200'
                    )}
                  >
                    {active && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-full" />
                    )}
                    <Icon className={cn(
                      'transition-colors',
                      active ? 'text-blue-400' : 'text-[var(--ds-text-3)] group-hover:text-[var(--ds-text-2)]'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('font-medium leading-none text-[12.5px]', active ? 'text-white' : '')}>{label}</p>
                      <p className="text-[10px] text-[var(--ds-text-3)] mt-0.5 leading-none truncate">{sub}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 border-t border-white/[0.055] pt-2 space-y-0.5 flex-shrink-0">
        <Link href="/" target="_blank"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] text-[var(--ds-text-3)] hover:bg-white/[0.04] hover:text-gray-300 transition-all">
          <IExternal />
          <span>צפה באתר</span>
        </Link>
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] text-[var(--ds-text-3)] hover:bg-red-500/10 hover:text-red-400 transition-all">
          <ILogOut />
          <span>התנתק</span>
        </button>
      </div>
    </aside>
  )
}
