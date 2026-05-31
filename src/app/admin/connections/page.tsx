'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

/* ── Types ──────────────────────────────────────────────── */
type Health = 'ok' | 'warning' | 'error' | 'unconfigured' | 'soon'

interface Connection {
  id: string
  name: string
  abbr: string
  accentClass: string       // bg + border + text for icon
  category: string
  health: Health
  detail: string
  metric?: string           // "94% delivery", "47ms"
  href: string
  configHref?: string       // link to settings if unconfigured
}

/* ── Icon Primitives ────────────────────────────────────── */
type P = { className?: string }
function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>
      {children}
    </svg>
  )
}
const ICheck = (p: P) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>
const IAlert = (p: P) => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const ICircleX = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Svg>
const IClock = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>
const IRefresh = (p: P) => <Svg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Svg>
const IArrow = (p: P) => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>
const ILink = (p: P) => <Svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>

/* ── Health Badge ───────────────────────────────────────── */
const HEALTH_META: Record<Health, { label: string; dot: string; badge: string; Icon: (p: P) => JSX.Element }> = {
  ok:           { label: 'מחובר',        dot: 'bg-emerald-400',  badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', Icon: ICheck    },
  warning:      { label: 'אזהרה',         dot: 'bg-amber-400',   badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',      Icon: IAlert    },
  error:        { label: 'שגיאה',         dot: 'bg-red-400',     badge: 'bg-red-500/10 border-red-500/20 text-red-400',            Icon: ICircleX  },
  unconfigured: { label: 'לא מוגדר',      dot: 'bg-gray-600',    badge: 'bg-white/[0.05] border-white/10 text-gray-500',           Icon: IClock    },
  soon:         { label: 'בקרוב',         dot: 'bg-gray-700',    badge: 'bg-white/[0.03] border-white/[0.05] text-gray-600',       Icon: IClock    },
}

function HealthBadge({ health }: { health: Health }) {
  const m = HEALTH_META[health]
  const { Icon } = m
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium border px-2 py-0.5 rounded-full ${m.badge}`}>
      <Icon className="w-2.5 h-2.5" />
      {m.label}
    </span>
  )
}

/* ── Connection Card ────────────────────────────────────── */
function ConnectionCard({ conn }: { conn: Connection }) {
  const m = HEALTH_META[conn.health]
  const target = conn.health === 'unconfigured' ? conn.configHref ?? conn.href : conn.href

  return (
    <Link href={target}
      className="bg-[#0E1629] border border-white/[0.055] rounded-xl p-4 flex items-center gap-3.5 hover:border-white/[0.09] hover:bg-[#121D33] transition-all group">

      {/* Logo */}
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 font-black text-[11px] tracking-tight ${conn.accentClass}`}>
        {conn.abbr}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-[var(--ds-text-1)]">{conn.name}</p>
          {conn.health === 'ok' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
        </div>
        <p className="text-[11px] text-[var(--ds-text-3)] truncate">{conn.detail}</p>
        {conn.metric && (
          <p className={`text-[10px] font-semibold mt-0.5 ${conn.health === 'ok' ? 'text-emerald-400' : conn.health === 'warning' ? 'text-amber-400' : 'text-[var(--ds-text-3)]'}`}>
            {conn.metric}
          </p>
        )}
      </div>

      {/* Status + arrow */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <HealthBadge health={conn.health} />
        <IArrow className="w-3 h-3 text-[var(--ds-text-3)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}

/* ── Section ────────────────────────────────────────────── */
function Section({ title, connections }: { title: string; connections: Connection[] }) {
  if (connections.length === 0) return null
  return (
    <div className="mb-6">
      <h2 className="text-[11px] font-bold text-[var(--ds-text-3)] uppercase tracking-[0.1em] mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {connections.map(c => <ConnectionCard key={c.id} conn={c} />)}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading]         = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const buildConnections = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentSettingsRes, marketingStatusRes, healthRes] = await Promise.all([
        fetch('/api/admin/payment-settings').then(r => r.json()).catch(() => ({ providers: [] })),
        fetch('/api/admin/marketing/status').then(r => r.json()).catch(() => ({ integrations: [], paidOrders7d: 0 })),
        fetch('/api/admin/health').then(r => r.json()).catch(() => ({ checks: [] })),
      ])

      const result: Connection[] = []

      // ── Payment providers ──────────────────────────────
      const paymentProviders: Array<{
        providerId: string; name: string; isConfigured: boolean; enabled: boolean; description: string
      }> = paymentSettingsRes.providers ?? []

      const PAYMENT_META: Record<string, { abbr: string; accentClass: string; href: string; configHref: string }> = {
        cardcom:  { abbr: 'CC', accentClass: 'bg-blue-500/12 border-blue-500/20 text-blue-400',    href: '/admin/payments', configHref: '/admin/payments?tab=settings' },
        meshulam: { abbr: 'MS', accentClass: 'bg-violet-500/12 border-violet-500/20 text-violet-400', href: '/admin/payments', configHref: '/admin/payments' },
        hyp:      { abbr: 'HP', accentClass: 'bg-orange-500/12 border-orange-500/20 text-orange-400', href: '/admin/payments', configHref: '/admin/payments' },
        tranzila: { abbr: 'TZ', accentClass: 'bg-cyan-500/12 border-cyan-500/20 text-cyan-400',    href: '/admin/payments', configHref: '/admin/payments' },
        paypal:   { abbr: 'PP', accentClass: 'bg-blue-400/12 border-blue-400/20 text-blue-300',    href: '/admin/payments', configHref: '/admin/payments' },
      }

      for (const p of paymentProviders) {
        const meta = PAYMENT_META[p.providerId] ?? {
          abbr: p.name.slice(0, 2).toUpperCase(),
          accentClass: 'bg-white/[0.05] border-white/10 text-gray-500',
          href: '/admin/payments',
          configHref: '/admin/payments',
        }
        result.push({
          id: `payment-${p.providerId}`,
          name: p.name,
          abbr: meta.abbr,
          accentClass: meta.accentClass,
          category: 'payments',
          health: !p.isConfigured ? 'unconfigured' : p.enabled ? 'ok' : 'warning',
          detail: p.description || 'ספק תשלומים',
          metric: p.isConfigured && p.enabled ? 'מוגדר ופעיל' : undefined,
          href: meta.href,
          configHref: meta.configHref,
        })
      }

      // ── Marketing integrations ─────────────────────────
      const integrations: Array<{
        id: string; name: string; pixelConfigured: boolean; serverSideConfigured: boolean
        fired7d: number | null; deliveryRate: number | null; detailUrl: string | null
      }> = marketingStatusRes.integrations ?? []

      const PIXEL_META: Record<string, { abbr: string; accentClass: string }> = {
        meta:    { abbr: 'FB', accentClass: 'bg-blue-600/15 border-blue-600/25 text-blue-400' },
        tiktok:  { abbr: 'TT', accentClass: 'bg-pink-500/12 border-pink-500/20 text-pink-400' },
        ga4:     { abbr: 'G4', accentClass: 'bg-amber-500/12 border-amber-500/20 text-amber-400' },
        gtm:     { abbr: 'GT', accentClass: 'bg-indigo-500/12 border-indigo-500/20 text-indigo-400' },
        gads:    { abbr: 'GA', accentClass: 'bg-emerald-500/12 border-emerald-500/20 text-emerald-400' },
      }

      for (const intg of integrations) {
        const meta = PIXEL_META[intg.id] ?? { abbr: intg.name.slice(0, 2).toUpperCase(), accentClass: 'bg-white/[0.05] border-white/10 text-gray-500' }
        const dr = intg.deliveryRate
        const health: Health = !intg.pixelConfigured ? 'unconfigured'
          : !intg.serverSideConfigured ? 'warning'
          : dr !== null && dr < 70 ? 'warning'
          : 'ok'

        result.push({
          id: `pixel-${intg.id}`,
          name: intg.name,
          abbr: meta.abbr,
          accentClass: meta.accentClass,
          category: 'pixels',
          health,
          detail: intg.pixelConfigured
            ? intg.serverSideConfigured ? 'Pixel + Server-Side API' : 'Pixel בלבד — ממליץ להוסיף CAPI'
            : 'דרוש הגדרה',
          metric: dr !== null ? `${dr}% delivery rate (7d)` : intg.fired7d ? `${intg.fired7d} events (7d)` : undefined,
          href: intg.detailUrl ?? '/admin/integrations/marketing',
          configHref: '/admin/integrations/marketing',
        })
      }

      // ── Platform services ──────────────────────────────
      const checks: Array<{ name: string; status: string; detail: string }> = healthRes.checks ?? []

      const serviceMap: Record<string, { abbr: string; accentClass: string; href: string }> = {
        'Cloudinary':       { abbr: 'CL', accentClass: 'bg-violet-500/12 border-violet-500/20 text-violet-400', href: '/admin/settings' },
        'SMTP Email':       { abbr: 'ML', accentClass: 'bg-emerald-500/12 border-emerald-500/20 text-emerald-400', href: '/admin/settings' },
        'Twilio WhatsApp':  { abbr: 'WA', accentClass: 'bg-green-500/12 border-green-500/20 text-green-400', href: '/admin/whatsapp' },
      }

      for (const [checkName, meta] of Object.entries(serviceMap)) {
        const check = checks.find(c => c.name === checkName || c.name?.includes(checkName.split(' ')[0]))
        const health: Health = !check ? 'unconfigured'
          : check.status === 'healthy' ? 'ok'
          : check.status === 'warning' ? 'warning'
          : check.status === 'critical' ? 'error'
          : 'unconfigured'

        const labels: Record<string, string> = {
          'Cloudinary': 'אחסון ועיבוד תמונות',
          'SMTP Email': 'שליחת מיילים ללקוחות',
          'Twilio WhatsApp': 'WhatsApp / SMS לקוחות',
        }

        result.push({
          id: `service-${checkName}`,
          name: checkName,
          abbr: meta.abbr,
          accentClass: meta.accentClass,
          category: 'services',
          health,
          detail: check?.detail ?? labels[checkName] ?? 'שירות פלטפורמה',
          href: meta.href,
          configHref: meta.href,
        })
      }

      setConnections(result)
      setLastChecked(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { buildConnections() }, [buildConnections])

  const connectedCount     = connections.filter(c => c.health === 'ok').length
  const warningCount       = connections.filter(c => c.health === 'warning').length
  const errorCount         = connections.filter(c => c.health === 'error').length
  const unconfiguredCount  = connections.filter(c => c.health === 'unconfigured').length

  const paymentConns  = connections.filter(c => c.category === 'payments')
  const pixelConns    = connections.filter(c => c.category === 'pixels')
  const serviceConns  = connections.filter(c => c.category === 'services')

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-[var(--ds-text-1)]">חיבורים</h1>
          <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">
            מרכז ניהול כל חיבורי הפלטפורם
            {lastChecked && ` · עודכן ${lastChecked.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button
          onClick={buildConnections}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0E1629] border border-white/[0.055] rounded-xl text-[12px] text-[var(--ds-text-2)] hover:text-[var(--ds-text-1)] hover:border-white/[0.09] transition-all disabled:opacity-50"
        >
          <IRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          רענן
        </button>
      </div>

      {/* Summary bar */}
      {!loading && connections.length > 0 && (
        <div className="flex items-center gap-5 mb-6 px-5 py-3.5 bg-[#0E1629] border border-white/[0.055] rounded-2xl flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xl font-bold text-emerald-400 num">{connectedCount}</span>
            <span className="text-[11px] text-[var(--ds-text-3)]">מחוברים</span>
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xl font-bold text-amber-400 num">{warningCount}</span>
              <span className="text-[11px] text-[var(--ds-text-3)]">אזהרות</span>
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xl font-bold text-red-400 num">{errorCount}</span>
              <span className="text-[11px] text-[var(--ds-text-3)]">שגיאות</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-600" />
            <span className="text-xl font-bold text-[var(--ds-text-3)] num">{unconfiguredCount}</span>
            <span className="text-[11px] text-[var(--ds-text-3)]">לא מוגדרים</span>
          </div>
          <div className="mr-auto">
            <Link href="/admin/health" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
              בדיקת בריאות מלאה →
            </Link>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          {[4, 5, 3].map((count, gi) => (
            <div key={gi}>
              <div className="h-3 bg-white/[0.05] rounded w-24 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[...Array(count)].map((_, i) => (
                  <div key={i} className="h-[68px] bg-white/[0.04] rounded-xl border border-white/[0.055]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <>
          <Section title="תשלומים" connections={paymentConns} />
          <Section title="פיקסלים ואנליטיקה" connections={pixelConns} />
          <Section title="שירותי פלטפורם" connections={serviceConns} />
        </>
      )}

      {/* Help footer */}
      {!loading && (
        <div className="mt-2 flex items-start gap-3 bg-[#0E1629] border border-white/[0.055] rounded-xl px-4 py-3.5">
          <ILink className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-medium text-[var(--ds-text-2)]">לחיבור שירות חדש</p>
            <p className="text-[11px] text-[var(--ds-text-3)] mt-0.5">
              פרטי גישה מוגדרים דרך Vercel Environment Variables בלבד. ראה{' '}
              <Link href="/admin/integrations/marketing" className="text-blue-400 hover:text-blue-300">מדריך הגדרה</Link>
              {' '}לפיקסלים ו-
              <Link href="/admin/payments?tab=settings" className="text-blue-400 hover:text-blue-300">הגדרות תשלום</Link>
              {' '}לספקי תשלומים.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
