'use client'
import { useEffect, useState } from 'react'

interface TikTokDiagnostics {
  pixelId: string
  eventsApiConfigured: boolean
  stats: {
    totalPaidOrders7d: number
    tiktokCapiFired7d: number
    tiktokPixelFired7d: number
    ttAttributed: number
    deliveryRate: number | null
  }
  checks: Array<{ id: string; name: string; status: 'ok' | 'warning' | 'error' | 'info'; detail: string }>
  overallStatus: 'ok' | 'warning' | 'error'
}

function StatusDot({ status }: { status: 'ok' | 'warning' | 'error' | 'info' }) {
  const colors = { ok: 'bg-emerald-400', warning: 'bg-amber-400', error: 'bg-red-400', info: 'bg-blue-400' }
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[status]}`} />
}

export default function TikTokDiagnosticsPage() {
  const [data, setData] = useState<TikTokDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/marketing/tiktok')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-white/[0.04] rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl" />)}
        </div>
        <div className="h-48 bg-white/[0.04] rounded-2xl" />
      </div>
    </div>
  )

  if (!data) return null

  const isConnected = data.pixelId && data.eventsApiConfigured

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-7">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-violet-400">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--ds-text-1)]">TikTok Ads — מעקב מכירות</h1>
            <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              isConnected
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : 'bg-red-400/10 border-red-400/20 text-red-400'
            }`}>
              <StatusDot status={isConnected ? 'ok' : 'error'} />
              {isConnected ? 'מחובר ופעיל' : 'לא מחובר'}
            </span>
          </div>
          <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">
            מעקב אוטומטי של מכירות מקמפיינים ב-TikTok
          </p>
        </div>
      </div>

      {/* Not connected state */}
      {!isConnected && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-400">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--ds-text-1)] text-[14px] mb-1">המעקב אינו פעיל</p>
              <p className="text-[12px] text-[var(--ds-text-3)] leading-relaxed mb-4">
                ללא חיבור TikTok, אינך יכול לדעת איזה סרטון או פרסומת הביאה כל מכירה.
              </p>
              <div className="space-y-2.5">
                {[
                  { n: '1', text: 'היכנס ל-TikTok Ads Manager ופתח "Events" → "Manage"' },
                  { n: '2', text: 'צור Pixel חדש — תקבל מספר Pixel ID' },
                  { n: '3', text: 'עבור ל-"Generate Access Token" עבור Events API' },
                  { n: '4', text: 'הוסף את שני הערכים בדף ההגדרות → אינטגרציות שיווק' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3 text-[12px] text-[var(--ds-text-3)]">
                    <span className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.055] flex items-center justify-center text-[10px] font-bold text-[var(--ds-text-2)] flex-shrink-0 mt-0.5">
                      {s.n}
                    </span>
                    {s.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className={`bg-[#0E1629] border rounded-2xl p-4 ${data.pixelId ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
          <p className="text-[10px] text-[var(--ds-text-3)] font-medium uppercase tracking-wide mb-2">פיקסל</p>
          <div className="flex items-center gap-2">
            <StatusDot status={data.pixelId ? 'ok' : 'error'} />
            <p className={`text-sm font-bold ${data.pixelId ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.pixelId ? 'מוגדר' : 'לא מוגדר'}
            </p>
          </div>
          {data.pixelId && <p className="text-[10px] text-[var(--ds-text-3)] font-mono mt-1 truncate">{data.pixelId}</p>}
        </div>

        <div className={`bg-[#0E1629] border rounded-2xl p-4 ${data.eventsApiConfigured ? 'border-emerald-500/20' : 'border-white/[0.055]'}`}>
          <p className="text-[10px] text-[var(--ds-text-3)] font-medium uppercase tracking-wide mb-2">שרת מעקב</p>
          <div className="flex items-center gap-2">
            <StatusDot status={data.eventsApiConfigured ? 'ok' : 'warning'} />
            <p className={`text-sm font-bold ${data.eventsApiConfigured ? 'text-emerald-400' : 'text-[var(--ds-text-2)]'}`}>
              {data.eventsApiConfigured ? 'פעיל' : 'לא מוגדר'}
            </p>
          </div>
          <p className="text-[10px] text-[var(--ds-text-3)] mt-1">מעקב מהשרת, לא מהדפדפן</p>
        </div>

        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4">
          <p className="text-[10px] text-[var(--ds-text-3)] font-medium uppercase tracking-wide mb-2">ייחוס 7 ימים</p>
          <div className="flex items-center gap-2">
            <StatusDot status={data.stats.ttAttributed > 0 ? 'ok' : 'info'} />
            <p className="text-sm font-bold text-[var(--ds-text-1)] num">{data.stats.ttAttributed}</p>
          </div>
          <p className="text-[10px] text-[var(--ds-text-3)] mt-1">הזמנות מ-TikTok</p>
        </div>
      </div>

      {/* Checks */}
      {data.checks.length > 0 && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-white/[0.055]">
            <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">בדיקות חיבור</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.checks.map(c => (
              <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusDot status={c.status === 'info' ? 'info' : c.status} />
                  <span className="text-[13px] text-[var(--ds-text-1)]">{c.name}</span>
                </div>
                <span className="text-[11px] text-[var(--ds-text-3)]">{c.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {data.eventsApiConfigured && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">7 ימים אחרונים</p>
          <div className="space-y-2.5">
            {[
              { label: 'מכירות שאושרו', value: data.stats.totalPaidOrders7d.toString() },
              { label: 'דווחו ל-TikTok', value: data.stats.tiktokCapiFired7d.toString() },
              {
                label: 'אחוז הצלחה',
                value: data.stats.deliveryRate !== null ? `${data.stats.deliveryRate}%` : '—',
              },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--ds-text-2)]">{row.label}</span>
                <span className="text-[12px] font-bold text-[var(--ds-text-1)] num">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
