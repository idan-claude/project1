'use client'
import { useEffect, useState } from 'react'

interface ConsistencyReport {
  ok: boolean
  paidOrders7d: number
  checkoutCompleteEvents7d: number
  warnings: string[]
}

export default function AnalyticsConsistencyBanner() {
  const [report, setReport] = useState<ConsistencyReport | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics/consistency')
      .then(r => r.ok ? r.json() : null)
      .then(d => setReport(d))
      .catch(() => null)
  }, [])

  if (!report || report.ok) return null

  return (
    <div className="mb-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
      <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-amber-400">אי-עקביות באנליטיקה</p>
        {report.warnings.map((w, i) => (
          <p key={i} className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">{w}</p>
        ))}
        <p className="text-[10px] text-gray-600 mt-1">
          {report.paidOrders7d} הזמנות ששולמו · {report.checkoutCompleteEvents7d} checkout events (7 ימים)
        </p>
      </div>
    </div>
  )
}
