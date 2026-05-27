'use client'
import { useEffect, useState, useCallback } from 'react'

interface Anomaly {
  id: string
  level: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  metric?: string
  timestamp: string
}

interface AnomalyData {
  anomalies: Anomaly[]
  summary: { critical: number; warning: number; info: number; healthy: boolean }
  snapshot: {
    visitors24h: number; visitorsPrev24h: number
    orders24h: number; checkoutStarts24h: number; rageClicks24h: number
  }
}

const levelConfig = {
  critical: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400', icon: '⚠' },
  warning:  { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400', icon: '⚡' },
  info:     { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400', icon: 'ℹ' },
}

export default function AnomaliesPage() {
  const [data, setData] = useState<AnomalyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/anomalies')
      .then(r => r.json())
      .then(d => { setData(d); setLastRefresh(new Date()); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [load])

  const { anomalies = [], summary, snapshot } = data || {}

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      <div className="border-b border-white/5 px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              {summary && (
                <div className={`w-2 h-2 rounded-full ${summary.healthy ? 'bg-emerald-400' : summary.critical > 0 ? 'bg-red-400 animate-pulse' : 'bg-amber-400'}`} />
              )}
              <h1 className="text-base font-semibold">Anomaly Detection</h1>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              ריענון אחרון: {lastRefresh.toLocaleTimeString('he-IL')}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="text-[11px] text-gray-500 hover:text-white border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
          >
            {loading ? 'טוען...' : 'רענן'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-3">
            <div className={`rounded-xl p-4 border ${summary.healthy ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/2 border-white/5'}`}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">סטטוס</p>
              <p className={`text-sm font-semibold mt-1 ${summary.healthy ? 'text-emerald-400' : 'text-white'}`}>
                {summary.healthy ? 'תקין' : 'דורש תשומת לב'}
              </p>
            </div>
            <div className={`rounded-xl p-4 border ${summary.critical > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/2 border-white/5'}`}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">קריטי</p>
              <p className={`text-sm font-semibold mt-1 ${summary.critical > 0 ? 'text-red-400' : 'text-gray-600'}`}>{summary.critical}</p>
            </div>
            <div className={`rounded-xl p-4 border ${summary.warning > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/2 border-white/5'}`}>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">אזהרה</p>
              <p className={`text-sm font-semibold mt-1 ${summary.warning > 0 ? 'text-amber-400' : 'text-gray-600'}`}>{summary.warning}</p>
            </div>
            <div className="rounded-xl p-4 border bg-white/2 border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">מבקרים 24h</p>
              <p className="text-sm font-semibold mt-1 text-white">{snapshot?.visitors24h || 0}</p>
            </div>
          </div>
        )}

        {/* Anomaly List */}
        {loading && !data ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : anomalies.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-xl p-12 text-center">
            <p className="text-3xl mb-3">✓</p>
            <p className="text-sm font-medium text-white">הכל תקין</p>
            <p className="text-xs text-gray-500 mt-1">לא זוהו חריגות במערכת</p>
            <p className="text-[10px] text-gray-600 mt-3">
              {snapshot?.visitors24h} מבקרים · {snapshot?.orders24h} הזמנות · {snapshot?.checkoutStarts24h} checkout starts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map(a => {
              const cfg = levelConfig[a.level]
              return (
                <div key={a.id} className={`rounded-xl p-5 border ${cfg.bg}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className={`text-sm mt-0.5 ${cfg.text}`}>{cfg.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-semibold ${cfg.text}`}>{a.title}</h3>
                          {a.metric && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${cfg.badge}`}>{a.metric}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{a.detail}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {new Date(a.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Snapshot */}
        {snapshot && (
          <div className="bg-[#111] border border-white/5 rounded-xl p-5">
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-4">תמונת מצב 24 שעות</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-gray-500">מבקרים</p>
                <p className="text-lg font-semibold text-white">{snapshot.visitors24h}</p>
                <p className="text-[10px] text-gray-600">אתמול: {snapshot.visitorsPrev24h}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">הזמנות ששולמו</p>
                <p className="text-lg font-semibold text-white">{snapshot.orders24h}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Rage Clicks</p>
                <p className={`text-lg font-semibold ${snapshot.rageClicks24h > 10 ? 'text-amber-400' : 'text-white'}`}>
                  {snapshot.rageClicks24h}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
