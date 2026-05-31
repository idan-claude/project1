'use client'
import { useEffect, useState } from 'react'

interface Check {
  id: string
  name: string
  status: 'ok' | 'warning' | 'error' | 'info'
  detail: string
}

interface MetaDiagnostics {
  pixelId: string
  capiConfigured: boolean
  testMode: boolean
  stats: {
    totalPaidOrders7d: number
    metaCapiFired7d: number
    capiDeliveryRate: number | null
    dedupRate: number | null
    capiFailedOrders: number
  }
  attributionBreakdown: Array<{ source: string; orders: number; revenue: number }>
  checks: Check[]
  overallStatus: 'ok' | 'warning' | 'error'
}

const CHECK_LABELS: Record<string, string> = {
  ok: 'תקין',
  warning: 'דורש תשומת לב',
  error: 'שגיאה',
  info: 'מידע',
}

function StatusDot({ status }: { status: 'ok' | 'warning' | 'error' }) {
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
      status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
    }`} />
  )
}

function CheckRow({ check }: { check: Check }) {
  const colors = {
    ok: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  }
  const bg = {
    ok: 'bg-emerald-400/10 border-emerald-400/20',
    warning: 'bg-amber-400/10 border-amber-400/20',
    error: 'bg-red-400/10 border-red-400/20',
    info: 'bg-blue-400/10 border-blue-400/20',
  }
  return (
    <div className="px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[check.status].replace('text-', 'bg-')}`} />
        <span className="text-[13px] text-[var(--ds-text-1)]">{check.name}</span>
      </div>
      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${bg[check.status]} ${colors[check.status]}`}>
        {check.detail}
      </span>
    </div>
  )
}

export default function MetaDiagnosticsPage() {
  const [data, setData] = useState<MetaDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/marketing/meta')
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

  const isConnected = data.pixelId && data.capiConfigured
  const deliveryOk = data.stats.capiDeliveryRate !== null && data.stats.capiDeliveryRate >= 90

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-7">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-400">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--ds-text-1)]">Meta Ads — מעקב מכירות</h1>
            <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              isConnected
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : 'bg-red-400/10 border-red-400/20 text-red-400'
            }`}>
              <StatusDot status={isConnected ? 'ok' : 'error'} />
              {isConnected ? 'מחובר ופעיל' : 'לא מחובר'}
            </span>
            {data.testMode && (
              <span className="text-[11px] px-2.5 py-1 rounded-full border bg-amber-400/10 border-amber-400/20 text-amber-400 font-medium">
                מצב בדיקות
              </span>
            )}
          </div>
          <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">
            כשלקוח קונה, המידע נשלח אוטומטית ל-Meta כדי לשפר את הקמפיינים שלך
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
                ללא חיבור Meta, לא ניתן לדעת מאיזה פרסומת הגיעה כל מכירה.
                Meta לא יוכל לאופטימיזציה את הקמפיינים שלך בצורה טובה.
              </p>
              <div className="space-y-2.5">
                {[
                  { n: '1', text: 'צור חשבון ב-Meta Business Suite (בחינם)' },
                  { n: '2', text: 'עבור ל-Events Manager ולחץ על "הוסף מקור נתונים"' },
                  { n: '3', text: 'צור Meta Pixel חדש — תקבל מספר זיהוי (Pixel ID)' },
                  { n: '4', text: 'צור System User Access Token ב-Business Settings' },
                  { n: '5', text: 'הוסף את שני הערכים בדף ההגדרות → אינטגרציות שיווק' },
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

        <div className={`bg-[#0E1629] border rounded-2xl p-4 ${data.capiConfigured ? 'border-emerald-500/20' : 'border-white/[0.055]'}`}>
          <p className="text-[10px] text-[var(--ds-text-3)] font-medium uppercase tracking-wide mb-2">שרת מעקב</p>
          <div className="flex items-center gap-2">
            <StatusDot status={data.capiConfigured ? 'ok' : 'warning'} />
            <p className={`text-sm font-bold ${data.capiConfigured ? 'text-emerald-400' : 'text-[var(--ds-text-2)]'}`}>
              {data.capiConfigured ? 'פעיל' : 'לא מוגדר'}
            </p>
          </div>
          <p className="text-[10px] text-[var(--ds-text-3)] mt-1">מעקב גם ללא Ad Blocker</p>
        </div>

        {data.capiConfigured && (
          <div className={`bg-[#0E1629] border rounded-2xl p-4 ${deliveryOk ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
            <p className="text-[10px] text-[var(--ds-text-3)] font-medium uppercase tracking-wide mb-2">אחוז הצלחה</p>
            <div className="flex items-center gap-2">
              <StatusDot status={deliveryOk ? 'ok' : 'warning'} />
              <p className={`text-sm font-bold num ${deliveryOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.stats.capiDeliveryRate !== null ? `${data.stats.capiDeliveryRate}%` : '—'}
              </p>
            </div>
            <p className="text-[10px] text-[var(--ds-text-3)] mt-1">מהמכירות הגיעו ל-Meta</p>
          </div>
        )}
      </div>

      {/* Checks */}
      {data.checks.length > 0 && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-3.5 border-b border-white/[0.055]">
            <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide">בדיקות חיבור</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {data.checks.map(c => <CheckRow key={c.id} check={c} />)}
          </div>
        </div>
      )}

      {/* Stats */}
      {data.capiConfigured && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
            <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">7 ימים אחרונים</p>
            <div className="space-y-2.5">
              {[
                { label: 'מכירות שאושרו', value: data.stats.totalPaidOrders7d.toString() },
                { label: 'דווחו ל-Meta', value: data.stats.metaCapiFired7d.toString() },
                { label: 'כפילויות הוסרו', value: data.stats.dedupRate !== null ? `${data.stats.dedupRate}%` : '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-[12px] text-[var(--ds-text-2)]">{row.label}</span>
                  <span className="text-[12px] font-bold text-[var(--ds-text-1)] num">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {data.attributionBreakdown.length > 0 && (
            <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
              <p className="text-[11px] font-semibold text-[var(--ds-text-3)] uppercase tracking-wide mb-3">מכירות לפי מקור</p>
              <div className="space-y-2.5">
                {data.attributionBreakdown.map(a => (
                  <div key={a.source} className="flex justify-between items-center">
                    <span className="text-[12px] text-[var(--ds-text-2)]">{a.source || 'כניסה ישירה'}</span>
                    <div className="flex gap-3 items-center">
                      <span className="text-[11px] text-[var(--ds-text-3)] num">{a.orders} הזמנות</span>
                      <span className="text-[12px] font-bold text-[var(--ds-text-1)] num">₪{Math.round(a.revenue / 100).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
