'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HealthItem {
  id: string
  label: string
  desc: string
  done: boolean
  weight: number
  category: 'brand' | 'product' | 'sales' | 'comms'
  action?: string
  actionLabel?: string
}

interface HealthData {
  score: number
  items: HealthItem[]
  nextStep: HealthItem | null
  storeName: string
}

const CATEGORY_CONFIG = {
  brand:   { label: 'מיתוג וזהות',    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: '🎨' },
  product: { label: 'מוצר',           color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     icon: '📦' },
  sales:   { label: 'מכירות ופרסום',  color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20',icon: '💳' },
  comms:   { label: 'תקשורת לקוחות', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',   icon: '📬' },
}

function ScoreGauge({ score }: { score: number }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#60a5fa'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-black text-white num">{score}</p>
        <p className="text-[10px] text-gray-500 -mt-0.5">מתוך 100</p>
      </div>
    </div>
  )
}

export default function StoreHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/readiness')
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-5 md:p-7 bg-[#070B14] min-h-screen animate-pulse" dir="rtl">
        <div className="h-7 bg-white/5 rounded-lg w-48 mb-2" />
        <div className="h-4 bg-white/[0.03] rounded w-64 mb-8" />
        <div className="h-40 bg-white/[0.04] rounded-2xl border border-white/[0.055] mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white/[0.04] rounded-2xl border border-white/[0.055]" />)}
        </div>
      </div>
    )
  }

  if (!data) return (
    <div className="p-7 bg-[#070B14] min-h-screen flex items-center justify-center" dir="rtl">
      <p className="text-gray-500">שגיאה בטעינת נתוני בריאות</p>
    </div>
  )

  const categories = (Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>)
    .map(cat => ({
      key: cat,
      ...CATEGORY_CONFIG[cat],
      items: data.items.filter(i => i.category === cat),
    }))
    .filter(c => c.items.length > 0)

  const doneCount = data.items.filter(i => i.done).length
  const scoreLabel = data.score >= 80 ? 'מצוין' : data.score >= 60 ? 'טוב' : data.score >= 40 ? 'בינוני' : 'מתחיל'
  const scoreColor = data.score >= 80 ? 'text-emerald-400' : data.score >= 60 ? 'text-blue-400' : data.score >= 40 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">בריאות החנות</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {data.storeName ? `חנות: ${data.storeName} · ` : ''}
          {doneCount} מתוך {data.items.length} משימות הושלמו
        </p>
      </div>

      {/* Score card */}
      <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={data.score} />
        <div className="flex-1 text-center sm:text-right">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <span className={`text-2xl font-black ${scoreColor}`}>{scoreLabel}</span>
            <span className="text-[11px] text-gray-600 border border-white/[0.07] px-2 py-0.5 rounded-full">{data.score}%</span>
          </div>
          <p className="text-[13px] text-gray-400 mb-4 max-w-xs">
            {data.score < 40
              ? 'החנות שלך עדיין לא מוכנה לקבל לקוחות. השלם את המשימות הקריטיות.'
              : data.score < 70
              ? 'התחלה טובה! כמה פעולות נוספות יגדילו את ההמרות שלך משמעותית.'
              : data.score < 90
              ? 'החנות שלך ברמה גבוהה. עוד כמה שיפורים ותהיה מושלמת.'
              : 'החנות שלך מוכנה לגמרי! ממשיך לפרסם ולמכור.'}
          </p>
          {/* Progress bar */}
          <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${data.score >= 80 ? 'bg-emerald-400' : data.score >= 50 ? 'bg-amber-400' : 'bg-blue-500'}`}
              style={{ width: `${data.score}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">{100 - data.score}% נותרו לציון מושלם</p>
        </div>

        {/* Next action CTA */}
        {data.nextStep?.action && (
          <Link href={data.nextStep.action}
            className="sm:w-48 w-full flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-semibold px-4 py-3 rounded-xl text-center transition-colors">
            <p className="text-[10px] text-blue-200 mb-0.5">הצעד הבא</p>
            <p>{data.nextStep.actionLabel || data.nextStep.label}</p>
          </Link>
        )}
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => {
          const catDone   = cat.items.filter(i => i.done).length
          const catTotal  = cat.items.length
          const catPct    = Math.round((cat.items.filter(i => i.done).reduce((s, i) => s + i.weight, 0) /
                              cat.items.reduce((s, i) => s + i.weight, 0)) * 100) || 0

          return (
            <div key={cat.key} className="bg-[#0E1629] border border-white/[0.055] rounded-2xl overflow-hidden">
              {/* Category header */}
              <div className={`px-4 py-3 border-b border-white/[0.055] flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{cat.label}</p>
                    <p className="text-[10px] text-gray-600">{catDone}/{catTotal} הושלמו</p>
                  </div>
                </div>
                <span className={`text-[13px] font-black num ${cat.color}`}>{catPct}%</span>
              </div>

              {/* Items */}
              <div className="divide-y divide-white/[0.04]">
                {cat.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Status dot */}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? 'bg-emerald-500/20' : 'bg-white/[0.05]'
                    }`}>
                      {item.done ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-emerald-400">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium ${item.done ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {item.label}
                      </p>
                      {!item.done && <p className="text-[10px] text-gray-600">{item.desc}</p>}
                    </div>

                    {/* Weight badge */}
                    <span className="text-[9px] text-gray-600 border border-white/[0.07] px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {item.weight}%
                    </span>

                    {/* Action link */}
                    {!item.done && item.action && (
                      <Link href={item.action}
                        className="text-[10px] text-blue-400 hover:text-blue-300 border border-blue-400/20 px-2 py-1 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap">
                        {item.actionLabel ?? 'פתח'}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* All done celebration */}
      {data.score >= 100 && (
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-emerald-400 font-bold text-lg">החנות שלך מושלמת!</p>
          <p className="text-gray-500 text-sm mt-1">כל הגדרות החנות הושלמו. ממשיך לפרסם ולמכור!</p>
        </div>
      )}
    </div>
  )
}
