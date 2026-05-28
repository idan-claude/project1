'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface EnvVar {
  key: string
  description: string
  required: boolean
}

interface Integration {
  id: string
  name: string
  description: string
  logoEmoji: string
  pixelConfigured: boolean
  pixelId: string
  serverSideConfigured: boolean
  fired7d: number | null
  deliveryRate: number | null
  detailUrl: string | null
  envVars: EnvVar[]
  setupSteps: string[]
}

interface StatusData {
  paidOrders7d: number
  integrations: Integration[]
}

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
      configured
        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
        : 'border-red-500/30 text-red-400 bg-red-500/10'
    }`}>
      {configured ? 'מחובר' : 'לא מוגדר'}
    </span>
  )
}

function DeliveryRate({ rate, orders }: { rate: number | null; orders: number | null }) {
  if (orders === null) return null
  if (orders === 0) return <span className="text-xs text-gray-600">אין עסקאות ל-7 ימים</span>
  if (rate === null) return <span className="text-xs text-gray-600">—</span>
  return (
    <span className={`text-xs font-semibold ${rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
      {rate}% נמסר ({orders}/7d)
    </span>
  )
}

export default function MarketingIntegrationsPage() {
  const [data, setData]             = useState<StatusData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [copiedKey, setCopiedKey]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/marketing/status')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const configured  = data?.integrations.filter(i => i.pixelConfigured).length ?? 0
  const total       = data?.integrations.length ?? 0

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/integrations" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">אינטגרציות</Link>
            <span className="text-gray-700">/</span>
            <span className="text-xs text-gray-400">שיווק</span>
          </div>
          <h1 className="text-xl font-bold text-white">אינטגרציות שיווק</h1>
          <p className="text-sm text-gray-500 mt-0.5">חיבור פיקסלים וכלי מדידה לפלטפורמות פרסום</p>
        </div>
        {!loading && (
          <div className={`sm:mr-auto px-4 py-2 rounded-xl border text-sm font-bold ${
            configured === total
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : configured > 0
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {configured}/{total} מחוברים
          </div>
        )}
      </div>

      {/* How it works banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-blue-400 mb-1">איך זה עובד?</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          פיקסל = קוד שרץ בדפדפן של הלקוח ומדווח על פעולות (ביקור, הוספה לסל, קנייה).
          Events API / CAPI = דיווח מהשרת שלנו — יותר מדויק, לא נחסם על ידי AdBlockers.
          <strong className="text-white"> כדאי להפעיל את שניהם.</strong>
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-[#0E1525] rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.integrations.map(integration => {
            const isExpanded = expanded === integration.id
            const fullyConfigured = integration.pixelConfigured && (integration.serverSideConfigured || integration.serverSideConfigured === false && !['meta','tiktok'].includes(integration.id))
            const needsServerSide = ['meta', 'tiktok'].includes(integration.id)

            return (
              <div key={integration.id}
                className={`bg-[#0E1525] border rounded-2xl overflow-hidden transition-all ${
                  integration.pixelConfigured ? 'border-emerald-500/20' : 'border-white/5'
                }`}>

                {/* Card header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : integration.id)}
                  className="w-full text-right p-4 flex items-center gap-3">

                  <span className="text-2xl flex-shrink-0">{integration.logoEmoji}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{integration.name}</p>
                      <StatusBadge configured={integration.pixelConfigured} />
                      {needsServerSide && integration.pixelConfigured && (
                        <StatusBadge configured={integration.serverSideConfigured} />
                      )}
                      {needsServerSide && integration.pixelConfigured && (
                        <DeliveryRate rate={integration.deliveryRate} orders={integration.fired7d} />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{integration.description}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {integration.detailUrl && (
                      <Link
                        href={integration.detailUrl}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                        פרטים
                      </Link>
                    )}
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expandable setup guide */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-4">

                    {/* Current status */}
                    {integration.pixelId && (
                      <div className="flex items-center justify-between bg-[#080C16] rounded-xl px-3 py-2">
                        <span className="text-xs text-gray-500">Pixel ID מחובר</span>
                        <code className="text-xs text-emerald-400 font-mono">{integration.pixelId}</code>
                      </div>
                    )}

                    {/* Steps */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2">מדריך הגדרה שלב אחר שלב:</p>
                      <ol className="space-y-2">
                        {integration.setupSteps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                              integration.pixelConfigured && i < 4
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-white/5 text-gray-600'
                            }`}>
                              {integration.pixelConfigured && i < 4 ? '✓' : i + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Env vars to set */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2">משתני סביבה להוסיף ב-Vercel:</p>
                      <div className="space-y-2">
                        {integration.envVars.map(v => (
                          <div key={v.key}
                            className={`flex items-center gap-2 p-2.5 rounded-xl ${
                              v.required ? 'bg-[#080C16]' : 'bg-[#080C16] opacity-60'
                            }`}>
                            <button
                              onClick={() => copyKey(v.key)}
                              className="flex-shrink-0 text-[10px] text-gray-600 hover:text-gray-300 bg-white/5 px-1.5 py-0.5 rounded transition-colors">
                              {copiedKey === v.key ? '✓' : 'העתק'}
                            </button>
                            <code className="text-[11px] text-blue-400 font-mono">{v.key}</code>
                            <span className="text-[11px] text-gray-600 flex-1 truncate">{v.description}</span>
                            {!v.required && <span className="text-[9px] text-gray-700 bg-white/5 px-1.5 py-0.5 rounded-full">אופציונלי</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    {!fullyConfigured && (
                      <a
                        href="https://vercel.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
                        פתח Vercel Dashboard להוספת משתנים ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom note */}
      <div className="mt-6 bg-[#0E1525] border border-white/5 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 mb-1">חשוב לדעת</p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• רכישות מדווחות רק לאחר אישור תשלום מ-Cardcom — לא מהדפדפן</li>
          <li>• זה מבטיח דיוק מלא: Behavior ≠ Purchase</li>
          <li>• אחרי שינוי משתני סביבה יש לפרס מחדש ב-Vercel</li>
        </ul>
      </div>
    </div>
  )
}
