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

const statusColors: Record<string, string> = {
  ok: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
  info: 'text-blue-400',
}

const statusBg: Record<string, string> = {
  ok: 'bg-emerald-400/10 border-emerald-400/20',
  warning: 'bg-amber-400/10 border-amber-400/20',
  error: 'bg-red-400/10 border-red-400/20',
  info: 'bg-blue-400/10 border-blue-400/20',
}

const statusIcon: Record<string, string> = { ok: '✓', warning: '⚠', error: '✕', info: 'ℹ' }

export default function MetaDiagnosticsPage() {
  const [data, setData] = useState<MetaDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/marketing/meta')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      <div className="border-b border-white/5 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${data.overallStatus === 'ok' ? 'bg-emerald-400' : data.overallStatus === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`} />
          <div>
            <h1 className="text-base font-semibold">Meta Pixel + CAPI</h1>
            <p className="text-[11px] text-gray-500">ניאגנוסטיקה של מעקב Meta</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">

        {/* Config Status */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-xl p-4 border ${data.pixelId ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Meta Pixel</p>
            <p className={`text-sm font-semibold mt-1 ${data.pixelId ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.pixelId ? `מוגדר` : 'לא מוגדר'}
            </p>
            {data.pixelId && <p className="text-[10px] text-gray-600 font-mono mt-0.5">{data.pixelId}</p>}
          </div>
          <div className={`rounded-xl p-4 border ${data.capiConfigured ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Conversions API</p>
            <p className={`text-sm font-semibold mt-1 ${data.capiConfigured ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.capiConfigured ? 'מוגדר' : 'לא מוגדר'}
            </p>
          </div>
          <div className={`rounded-xl p-4 border ${data.testMode ? 'bg-amber-400/5 border-amber-400/20' : 'bg-white/3 border-white/5'}`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">מצב</p>
            <p className={`text-sm font-semibold mt-1 ${data.testMode ? 'text-amber-400' : 'text-white'}`}>
              {data.testMode ? 'בדיקה' : 'Production'}
            </p>
          </div>
        </div>

        {/* Checks */}
        <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">בדיקות מערכת</h2>
          </div>
          <div className="divide-y divide-white/5">
            {data.checks.map(c => (
              <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${statusColors[c.status]}`}>{statusIcon[c.status]}</span>
                  <span className="text-sm text-white">{c.name}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded border ${statusBg[c.status]} ${statusColors[c.status]}`}>
                  {c.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">7 ימים אחרונים</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">הזמנות ששולמו</span>
                <span className="text-xs font-semibold text-white">{data.stats.totalPaidOrders7d}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">CAPI נורה</span>
                <span className="text-xs font-semibold text-white">{data.stats.metaCapiFired7d}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">אחוז הגעה</span>
                <span className={`text-xs font-semibold ${data.stats.capiDeliveryRate !== null && data.stats.capiDeliveryRate >= 90 ? 'text-emerald-400' : data.stats.capiDeliveryRate !== null && data.stats.capiDeliveryRate >= 70 ? 'text-amber-400' : 'text-gray-400'}`}>
                  {data.stats.capiDeliveryRate !== null ? `${data.stats.capiDeliveryRate}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">כפילויות (dedup)</span>
                <span className="text-xs font-semibold text-white">
                  {data.stats.dedupRate !== null ? `${data.stats.dedupRate}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-3">ייחוס לפי מקור</p>
            {data.attributionBreakdown.length === 0 ? (
              <p className="text-xs text-gray-600 py-2">אין נתוני ייחוס עדיין</p>
            ) : (
              <div className="space-y-2">
                {data.attributionBreakdown.map(a => (
                  <div key={a.source} className="flex justify-between">
                    <span className="text-xs text-gray-400">{a.source || 'ישיר'}</span>
                    <div className="flex gap-3">
                      <span className="text-xs text-gray-500">{a.orders} הזמנות</span>
                      <span className="text-xs font-semibold text-white">₪{Math.round(a.revenue / 100).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Setup guide if not configured */}
        {!data.capiConfigured && (
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">הגדרה נדרשת</h3>
            <p className="text-xs text-gray-400 mb-3">הוסף את המשתני הסביבה הבאים ל-Vercel:</p>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="bg-black/30 px-3 py-1.5 rounded"><span className="text-gray-500">NEXT_PUBLIC_META_PIXEL_ID</span>=<span className="text-emerald-400">ה-Pixel ID שלך</span></div>
              <div className="bg-black/30 px-3 py-1.5 rounded"><span className="text-gray-500">META_PIXEL_ID</span>=<span className="text-emerald-400">ה-Pixel ID שלך</span></div>
              <div className="bg-black/30 px-3 py-1.5 rounded"><span className="text-gray-500">META_CAPI_TOKEN</span>=<span className="text-emerald-400">System User Access Token מ-Events Manager</span></div>
              <div className="bg-black/30 px-3 py-1.5 rounded text-gray-600"><span className="text-gray-500">META_CAPI_TEST_CODE</span>=<span className="text-gray-500">TEST12345 (לבדיקות בלבד)</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
