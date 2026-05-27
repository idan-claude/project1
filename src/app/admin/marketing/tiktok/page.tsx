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

const statusColors: Record<string, string> = {
  ok: 'text-emerald-400', warning: 'text-amber-400', error: 'text-red-400', info: 'text-blue-400',
}
const statusIcon: Record<string, string> = { ok: '✓', warning: '⚠', error: '✕', info: 'ℹ' }

export default function TikTokDiagnosticsPage() {
  const [data, setData] = useState<TikTokDiagnostics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/marketing/tiktok')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )

  if (!data) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      <div className="border-b border-white/5 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${data.overallStatus === 'ok' ? 'bg-emerald-400' : data.overallStatus === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`} />
          <div>
            <h1 className="text-base font-semibold">TikTok Pixel + Events API</h1>
            <p className="text-[11px] text-gray-500">ניאגנוסטיקה של מעקב TikTok</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-xl p-4 border ${data.pixelId ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">TikTok Pixel</p>
            <p className={`text-sm font-semibold mt-1 ${data.pixelId ? 'text-emerald-400' : 'text-red-400'}`}>{data.pixelId ? 'מוגדר' : 'לא מוגדר'}</p>
            {data.pixelId && <p className="text-[10px] text-gray-600 font-mono mt-0.5">{data.pixelId}</p>}
          </div>
          <div className={`rounded-xl p-4 border ${data.eventsApiConfigured ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-red-400/5 border-red-400/20'}`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Events API</p>
            <p className={`text-sm font-semibold mt-1 ${data.eventsApiConfigured ? 'text-emerald-400' : 'text-red-400'}`}>{data.eventsApiConfigured ? 'מוגדר' : 'לא מוגדר'}</p>
          </div>
          <div className="rounded-xl p-4 border border-white/5 bg-white/2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">ייחוס 7 ימים</p>
            <p className="text-sm font-semibold mt-1 text-white">{data.stats.ttAttributed} הזמנות</p>
          </div>
        </div>

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
                <span className={`text-[11px] text-gray-400`}>{c.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {!data.eventsApiConfigured && (
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-3">הגדרה נדרשת</h3>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="bg-black/30 px-3 py-1.5 rounded"><span className="text-gray-500">NEXT_PUBLIC_TIKTOK_PIXEL_ID</span>=<span className="text-emerald-400">Pixel ID מ-TikTok Ads</span></div>
              <div className="bg-black/30 px-3 py-1.5 rounded"><span className="text-gray-500">TIKTOK_PIXEL_ID</span>=<span className="text-emerald-400">Pixel ID (server-side)</span></div>
              <div className="bg-black/30 px-3 py-1.5 rounded"><span className="text-gray-500">TIKTOK_EVENTS_API_TOKEN</span>=<span className="text-emerald-400">Access Token מ-TikTok for Business</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
