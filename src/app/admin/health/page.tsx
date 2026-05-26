'use client'
import { useEffect, useState } from 'react'

interface HealthCheck {
  name: string
  status: 'healthy' | 'warning' | 'critical'
  detail: string
  latencyMs?: number
}

interface HealthData {
  overallStatus: 'healthy' | 'warning' | 'critical'
  criticalCount: number
  warningCount: number
  checks: HealthCheck[]
  generatedAt: string
}

const STATUS_CONFIG = {
  healthy:  { label: 'תקין',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
  warning:  { label: 'אזהרה', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-500' },
  critical: { label: 'קריטי',  color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       dot: 'bg-red-500' },
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/health')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">בריאות המערכת</h1>
          <p className="text-sm text-gray-500 mt-0.5">אבחון אמיתי של כל רכיבי החנות</p>
        </div>
        <button
          onClick={load}
          className="text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-[#0E1525] border border-white/5 rounded-lg transition-colors"
        >
          רענן
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-[#0E1525] rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Overall status */}
          <div className={`border rounded-2xl p-5 mb-6 ${STATUS_CONFIG[data.overallStatus].bg}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[data.overallStatus].dot} animate-pulse`} />
              <div>
                <p className={`font-bold ${STATUS_CONFIG[data.overallStatus].color}`}>
                  {data.overallStatus === 'healthy' ? 'כל המערכות תקינות' :
                   data.overallStatus === 'warning' ? `${data.warningCount} אזהרות פעילות` :
                   `${data.criticalCount} בעיות קריטיות`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  עודכן: {new Date(data.generatedAt).toLocaleTimeString('he-IL')}
                  {' · '}
                  {data.criticalCount} קריטי · {data.warningCount} אזהרה ·{' '}
                  {data.checks.filter(c => c.status === 'healthy').length} תקין
                </p>
              </div>
            </div>
          </div>

          {/* Critical first */}
          {['critical', 'warning', 'healthy'].map(status => {
            const group = data.checks.filter(c => c.status === status)
            if (group.length === 0) return null
            return (
              <div key={status} className="mb-4">
                <h2 className={`text-xs font-semibold ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color} mb-2 uppercase tracking-wider`}>
                  {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label} ({group.length})
                </h2>
                <div className="space-y-2">
                  {group.map((check, i) => (
                    <div key={i} className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[check.status].dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{check.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{check.detail}</p>
                      </div>
                      {check.latencyMs !== undefined && (
                        <span className={`text-xs flex-shrink-0 ${check.latencyMs < 500 ? 'text-emerald-400' : check.latencyMs < 2000 ? 'text-amber-400' : 'text-red-400'}`}>
                          {check.latencyMs}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      {!loading && !data && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-red-400 text-sm">שגיאה בטעינת נתוני הבריאות</p>
        </div>
      )}
    </div>
  )
}
