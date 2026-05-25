'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CartSession {
  sessionId: string
  visitorId: string
  lastSeen: string
  firstSeen: string
  device: string
  lastPath: string
  eventCount: number
}

interface Stats {
  totalAbandoned7d: number
  totalAbandoned30d: number
  abandonRate: number
  totalOrders30d: number
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'עכשיו'
  if (m < 60) return `לפני ${m} דקות`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שעות`
  return `לפני ${Math.floor(h / 24)} ימים`
}

const DEVICE_ICON: Record<string, string> = { mobile: '📱', desktop: '🖥️', tablet: '📲', unknown: '❓' }

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<CartSession[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/abandoned-carts')
      .then(r => r.json())
      .then(d => { setCarts(d.carts || []); setStats(d.stats || null) })
      .catch(() => setCarts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">עגלות נטושות</h1>
          <p className="text-sm text-gray-500 mt-0.5">סשנים שהוסיפו לסל ולא השלימו רכישה</p>
        </div>
        <Link href="/admin/automations" className="sm:mr-auto">
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
            ⚡ הפעל אוטומציה
          </button>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'נטישה 7 ימים', value: stats.totalAbandoned7d.toString(), color: 'text-white' },
            { label: 'שיעור נטישה', value: stats.abandonRate > 0 ? `${stats.abandonRate}%` : '—', color: stats.abandonRate > 70 ? 'text-red-400' : 'text-amber-400' },
            { label: 'נטישה 30 יום', value: stats.totalAbandoned30d.toString(), color: 'text-white' },
            { label: 'רכישות 30 יום', value: stats.totalOrders30d.toString(), color: 'text-emerald-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.abandonRate > 60 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-400">שיעור נטישה גבוה — {stats.abandonRate}%</p>
            <p className="text-xs text-gray-500 mt-0.5">הפעל אוטומציית "עגלה נטושה" שתשלח תזכורת לאחר שעה. ממוצע שיפור: 15-25% המרה נוספת.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-[#0E1525] rounded-2xl animate-pulse" />)}</div>
      ) : carts.length === 0 ? (
        <div className="text-center py-20 bg-[#0E1525] border border-white/5 rounded-2xl">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-white font-semibold">אין עגלות נטושות</p>
          <p className="text-xs text-gray-600 mt-1">עגלות נטושות מזוהות לפי event tracking בחנות</p>
        </div>
      ) : (
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-5 gap-2 px-5 py-3 border-b border-white/5 text-xs font-medium text-gray-500">
            <span>סשן</span>
            <span>מכשיר</span>
            <span>דף אחרון</span>
            <span>פעולות</span>
            <span>נטש</span>
          </div>
          <div className="divide-y divide-white/5">
            {carts.map(cart => (
              <div key={cart.sessionId} className="px-5 py-3.5 grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                <span className="font-mono text-xs text-gray-600 truncate">{cart.sessionId.slice(-8)}</span>
                <span className="text-sm">{DEVICE_ICON[cart.device] || '❓'} <span className="text-xs text-gray-500">{cart.device}</span></span>
                <span className="text-xs text-gray-400 truncate hidden md:block">{cart.lastPath || '/'}</span>
                <span className="text-xs text-gray-600 hidden md:block">{cart.eventCount} אירועים</span>
                <span className="text-xs text-gray-500">{timeAgo(cart.lastSeen)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 bg-[#0E1525] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-blue-400 text-sm flex-shrink-0">ℹ</span>
        <p className="text-xs text-gray-600">
          עגלות נטושות מזוהות לפי VisitorEvent tracking. לשליחת תזכורות אוטומטיות נדרש חיבור SMTP ו-Twilio.
          <Link href="/admin/automations" className="text-blue-400 hover:underline mr-1">הגדר אוטומציות ←</Link>
        </p>
      </div>
    </div>
  )
}
