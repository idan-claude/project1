'use client'
import Link from 'next/link'

type Status = 'active' | 'pending' | 'soon'

const INTEGRATIONS: Array<{
  name: string
  desc: string
  detail: string
  status: Status
  href: string
  color: string
  abbr: string
}> = [
  {
    name: 'Cardcom',
    desc: 'שער תשלומים ישראלי',
    detail: 'כרטיסי אשראי · ביט · אפל פיי',
    status: 'pending',
    href: '/admin/payments',
    color: 'bg-blue-500/12 border-blue-500/20 text-blue-400',
    abbr: 'CC',
  },
  {
    name: 'Twilio',
    desc: 'הודעות ותקשורת',
    detail: 'WhatsApp · SMS ללקוחות',
    status: 'pending',
    href: '/admin/whatsapp',
    color: 'bg-red-500/12 border-red-500/20 text-red-400',
    abbr: 'TW',
  },
  {
    name: 'Cloudinary',
    desc: 'ניהול מדיה',
    detail: 'אחסון ועיבוד תמונות',
    status: 'pending',
    href: '/admin/settings',
    color: 'bg-violet-500/12 border-violet-500/20 text-violet-400',
    abbr: 'CL',
  },
  {
    name: 'AliExpress',
    desc: 'ייבוא מוצרים',
    detail: 'ייבוא ישיר ממקור',
    status: 'pending',
    href: '/admin/import',
    color: 'bg-orange-500/12 border-orange-500/20 text-orange-400',
    abbr: 'AE',
  },
  {
    name: 'Email SMTP',
    desc: 'שליחת מיילים',
    detail: 'Gmail · Mailgun · לקוחות',
    status: 'pending',
    href: '/admin/automations',
    color: 'bg-emerald-500/12 border-emerald-500/20 text-emerald-400',
    abbr: 'ML',
  },
  {
    name: 'שיווק ופיקסלים',
    desc: 'מעקב פרסומי',
    detail: 'Meta · TikTok · GA4 · GTM',
    status: 'active',
    href: '/admin/integrations/marketing',
    color: 'bg-blue-500/12 border-blue-500/20 text-blue-400',
    abbr: 'PX',
  },
  {
    name: 'Google Analytics',
    desc: 'אנליטיקת ביקורים',
    detail: 'משפכי המרה · אירועים',
    status: 'soon',
    href: '/admin/integrations/marketing',
    color: 'bg-amber-500/12 border-amber-500/20 text-amber-400',
    abbr: 'GA',
  },
  {
    name: 'Meshulam',
    desc: 'שער תשלומים חלופי',
    detail: 'אינטגרציה נוספת',
    status: 'soon',
    href: '#',
    color: 'bg-white/[0.05] border-white/10 text-gray-500',
    abbr: 'MS',
  },
]

const STATUS_META: Record<Status, { label: string; dot: string; badge: string }> = {
  active:  { label: 'מחובר',          dot: 'bg-emerald-400', badge: 'bg-emerald-500/12 border-emerald-500/20 text-emerald-400' },
  pending: { label: 'ממתין לחיבור',   dot: 'bg-amber-400',   badge: 'bg-amber-500/12 border-amber-500/20 text-amber-400' },
  soon:    { label: 'בקרוב',          dot: 'bg-gray-600',    badge: 'bg-white/[0.05] border-white/10 text-gray-500' },
}

export default function IntegrationsPage() {
  return (
    <div className="p-5 md:p-7 min-h-screen bg-[#070B14]" dir="rtl">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-[var(--ds-text-1)]">אינטגרציות</h1>
        <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">חיבור לשירותים ופלטפורמות חיצוניות</p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-5 mb-6 px-5 py-3.5 bg-[#0E1629] border border-white/[0.055] rounded-2xl">
        {[
          { count: INTEGRATIONS.filter(i => i.status === 'active').length,  label: 'מחוברות', color: 'text-emerald-400' },
          { count: INTEGRATIONS.filter(i => i.status === 'pending').length, label: 'ממתינות', color: 'text-amber-400' },
          { count: INTEGRATIONS.filter(i => i.status === 'soon').length,    label: 'בקרוב',   color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`text-xl font-bold num ${s.color}`}>{s.count}</span>
            <span className="text-[11px] text-[var(--ds-text-3)]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTEGRATIONS.map(item => {
          const st = STATUS_META[item.status]
          return (
            <Link
              key={item.name}
              href={item.href}
              className="bg-[#0E1629] border border-white/[0.055] rounded-xl p-4 flex items-center gap-4 hover:border-white/[0.09] hover:bg-[#121D33] transition-all group"
            >
              {/* Logo */}
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <span className="text-[12px] font-black tracking-tight">{item.abbr}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-[var(--ds-text-1)]">{item.name}</p>
                  {item.status === 'active' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-[var(--ds-text-3)] mt-0.5">{item.desc}</p>
                <p className="text-[10px] text-[var(--ds-text-3)]/70 mt-0.5">{item.detail}</p>
              </div>

              {/* Status badge */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${st.badge}`}>
                  <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                <svg className="w-3.5 h-3.5 text-[var(--ds-text-3)] opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Bottom note */}
      <div className="mt-5 flex items-start gap-3 bg-[#0E1629] border border-white/[0.055] rounded-xl px-4 py-3.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-[11px] text-[var(--ds-text-3)]">
          לחיבור אינטגרציה חדשה עקוב אחר המדריך בהגדרות החנות. כל אינטגרציה דורשת API key או הגדרות ייחודיות.
        </p>
      </div>
    </div>
  )
}
