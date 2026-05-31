'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'
import AnalyticsConsistencyBanner from '@/components/admin/AnalyticsConsistencyBanner'

interface Insight {
  severity: 'critical' | 'warning' | 'info'
  title: string
  detail: string
  action: string
}

interface ConversionData {
  funnel: {
    productViews: number
    cartEvents: number
    checkoutStarts: number
    paidOrders: number
  }
  rates: {
    cartConversion: number
    checkoutConversion: number
    purchaseConversion: number
    overallConversion: number
  }
  revenue: {
    totalRevenue: number
    avgOrderValue: number
    paidOrders: number
  }
  exitPages: Array<{ _id: string; exits: number }>
  insights: Insight[]
}

const SEV_CLR: Record<string, string> = {
  critical: 'border-red-500/25 bg-red-500/8',
  warning:  'border-amber-500/25 bg-amber-500/8',
  info:     'border-blue-500/25 bg-blue-500/8',
}
const SEV_TEXT: Record<string, string> = {
  critical: 'text-red-400',
  warning:  'text-amber-400',
  info:     'text-blue-400',
}
function SevIcon({ sev }: { sev: string }) {
  if (sev === 'critical') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-400 flex-shrink-0">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
  if (sev === 'warning') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-400 flex-shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-400 flex-shrink-0">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

export default function AIInsightsPage() {
  const [data, setData] = useState<ConversionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/conversion')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-5 md:p-7 min-h-screen bg-[#070B14] space-y-3 animate-pulse">
      <div className="h-7 bg-white/[0.05] rounded-lg w-44 mb-1.5" />
      <div className="h-4 bg-white/[0.03] rounded w-80 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/[0.04] rounded-2xl border border-white/[0.055]" />)}
      </div>
    </div>
  )

  return (
    <div className="p-5 md:p-7 min-h-screen bg-[#070B14]" dir="rtl">
      <AnalyticsConsistencyBanner />
      <div className="mb-7">
        <h1 className="text-xl font-bold text-[var(--ds-text-1)]">תובנות חכמות</h1>
        <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">ניתוח המרות ועצות לשיפור הכנסות — מבוסס על נתוני מסד הנתונים בלבד</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'המרה כוללת',
              value: data.rates.overallConversion > 0 ? `${data.rates.overallConversion}%` : '—',
              sub: 'ביקור → רכישה',
              color: data.rates.overallConversion > 2 ? 'text-emerald-400' : data.rates.overallConversion > 0.5 ? 'text-amber-400' : 'text-gray-500',
            },
            {
              label: 'הכנסה 30 יום',
              value: data.revenue.totalRevenue > 0 ? formatPrice(data.revenue.totalRevenue) : '—',
              sub: 'הזמנות ששולמו',
              color: 'text-[var(--ds-text-1)]',
            },
            {
              label: 'ממוצע הזמנה',
              value: data.revenue.avgOrderValue > 0 ? formatPrice(data.revenue.avgOrderValue) : '—',
              sub: 'AOV',
              color: 'text-blue-400',
            },
            {
              label: 'נטישת עגלה',
              value: data.funnel.cartEvents > 0
                ? `${Math.round(((data.funnel.cartEvents - data.funnel.paidOrders) / data.funnel.cartEvents) * 100)}%`
                : '—',
              sub: `${data.funnel.cartEvents} הוסיפו לסל`,
              color: data.funnel.cartEvents > data.funnel.paidOrders * 1.5 ? 'text-red-400' : 'text-emerald-400',
            },
          ].map((kpi, i) => (
            <div key={i} className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4">
              <p className="text-[11px] text-[var(--ds-text-3)] font-medium">{kpi.label}</p>
              <p className={`text-xl font-bold mt-1 num ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] text-[var(--ds-text-3)] mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-[13px] font-semibold text-[var(--ds-text-1)] mb-0.5">המלצות לפעולה</h2>
        <p className="text-[11px] text-[var(--ds-text-3)] mb-4">מבוסס על ניתוח נתוני החנות האמיתיים — לא כללי</p>
        {!data || data.insights.length === 0 ? (
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.055] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[var(--ds-text-3)]">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <p className="text-[var(--ds-text-2)] font-semibold text-[13px]">אין מספיק נתונים עדיין</p>
            <p className="text-[11px] text-[var(--ds-text-3)] mt-1">ככל שיותר גולשים יגיעו לחנות, התובנות יהיו מדויקות יותר</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.insights.map((insight, i) => (
              <div key={i} className={`border rounded-2xl p-4 ${SEV_CLR[insight.severity]}`}>
                <div className="flex items-start gap-3">
                  <SevIcon sev={insight.severity} />
                  <div className="flex-1">
                    <p className={`text-[13px] font-bold ${SEV_TEXT[insight.severity]}`}>{insight.title}</p>
                    <p className="text-[12px] text-[var(--ds-text-2)] mt-1">{insight.detail}</p>
                    <div className="mt-2.5 bg-black/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <div>
                        <p className="text-[11px] font-semibold text-[var(--ds-text-2)]">פעולה מומלצת</p>
                        <p className="text-[11px] text-[var(--ds-text-3)] mt-0.5">{insight.action}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5 mb-5">
          <h2 className="text-[13px] font-semibold text-[var(--ds-text-1)] mb-0.5">משפך 30 יום</h2>
          <p className="text-[11px] text-[var(--ds-text-3)] mb-4">נתונים אמיתיים מ-VisitorEvent ו-Orders</p>
          {[
            { label: 'ביקורי דף מוצר', val: data.funnel.productViews, color: 'bg-blue-500' },
            { label: 'הוסיפו לסל', val: data.funnel.cartEvents, color: 'bg-indigo-500' },
            { label: 'התחילו תשלום', val: data.funnel.checkoutStarts, color: 'bg-violet-500' },
            { label: 'השלימו רכישה', val: data.funnel.paidOrders, color: 'bg-emerald-500' },
          ].map((step, i) => {
            const base = Math.max(data.funnel.productViews, 1)
            const pct = Math.round((step.val / base) * 100)
            return (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between mb-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-gray-400 text-[10px]">{i + 1}</span>
                    <span className="text-gray-300">{step.label}</span>
                  </div>
                  <span className="text-white font-bold">{step.val.toLocaleString('he-IL')}</span>
                </div>
                <div className="bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full`} style={{ width: `${Math.max(2, pct)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data && data.exitPages.length > 0 && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5 mb-5">
          <h2 className="text-[13px] font-semibold text-[var(--ds-text-1)] mb-0.5">דפי יציאה</h2>
          <p className="text-[11px] text-[var(--ds-text-3)] mb-4">מקומות שמשם גולשים עוזבים בלי לקנות</p>
          <div className="space-y-0 divide-y divide-white/[0.04]">
            {data.exitPages.map((page, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <span className="text-[12px] text-[var(--ds-text-2)]">{page._id || '/'}</span>
                <span className="text-[11px] font-semibold text-red-400 num">{page.exits} יציאות</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#0E1629] border border-white/[0.055] rounded-xl px-4 py-3.5 flex items-start gap-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-[11px] text-[var(--ds-text-3)]">כל ניתוח מבוסס על נתוני VisitorEvent ו-Orders ממסד הנתונים. אין נתוני demo. ככל שיותר תנועה, הדיוק גבוה יותר.</p>
      </div>
    </div>
  )
}
