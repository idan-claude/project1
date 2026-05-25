'use client'
import { useEffect, useState } from 'react'

interface FunnelData {
  productViews: number
  addToCart: number
  checkoutStart: number
  checkoutComplete: number
  totalOrders: number
  paidOrders: number
  avgOrderValue: number
  abandonedCarts: number
  abandonRate: number
}

interface StepData {
  label: string
  value: number
  sub: string
  color: string
  pct: number
  drop?: number
}

export default function FunnelsPage() {
  const [data, setData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/visitors').then(r => r.json()),
      fetch('/api/admin/dashboard').then(r => r.json()),
    ]).then(([visitors, dashboard]) => {
      const productViews = visitors?.byEvent?.['product_view'] || 0
      const addToCart = visitors?.cartEvents || 0
      const checkoutStart = visitors?.checkoutStarts || 0
      const checkoutComplete = visitors?.checkoutCompletes || 0
      const totalOrders = dashboard?.orderCountMonth || 0
      const avgOrderValue = dashboard?.avgOrderValue || 0

      const abandonedCarts = Math.max(0, addToCart - checkoutComplete)
      const abandonRate = addToCart > 0 ? Math.round((abandonedCarts / addToCart) * 100) : 0

      setData({
        productViews,
        addToCart,
        checkoutStart,
        checkoutComplete: Math.max(checkoutComplete, totalOrders),
        totalOrders,
        paidOrders: totalOrders,
        avgOrderValue,
        abandonedCarts,
        abandonRate,
      })
    }).catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 min-h-screen bg-[#080C16] space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[#0E1525] rounded-2xl animate-pulse" />)}
    </div>
  )

  const steps: StepData[] = data ? (() => {
    const base = Math.max(data.productViews, data.addToCart, data.checkoutStart, data.totalOrders, 1)
    const arr = [
      { label: 'ביקורי דף מוצר', value: data.productViews, sub: 'מ-event tracking', color: 'bg-blue-500', pct: Math.round((data.productViews / base) * 100) },
      { label: 'הוספה לסל', value: data.addToCart, sub: 'לחצו "הוסף לסל"', color: 'bg-indigo-500', pct: Math.round((data.addToCart / base) * 100) },
      { label: 'התחלת תשלום', value: data.checkoutStart, sub: 'הגיעו לדף תשלום', color: 'bg-violet-500', pct: Math.round((data.checkoutStart / base) * 100) },
      { label: 'השלמת רכישה', value: data.totalOrders, sub: 'הזמנות ששולמו', color: 'bg-emerald-500', pct: Math.round((data.totalOrders / base) * 100) },
    ]
    return arr.map((step, i) => ({
      ...step,
      drop: i > 0 && arr[i - 1].value > 0
        ? Math.round(((arr[i - 1].value - step.value) / arr[i - 1].value) * 100)
        : undefined,
    }))
  })() : []

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">משפכי המרה</h1>
        <p className="text-sm text-gray-500 mt-0.5">מעקב אחר הדרך מביקור ראשון ועד רכישה מושלמת</p>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'שיעור המרה כולל',
              value: data.productViews > 0 && data.totalOrders > 0
                ? `${((data.totalOrders / data.productViews) * 100).toFixed(1)}%`
                : data.totalOrders > 0 ? `${data.totalOrders} הזמנות` : '—',
              sub: 'מביקור לרכישה',
              color: 'text-emerald-400',
            },
            {
              label: 'נטישת עגלה',
              value: data.addToCart > 0 ? `${data.abandonRate}%` : '—',
              sub: `${data.abandonedCarts} עגלות נטושות`,
              color: data.abandonRate > 70 ? 'text-red-400' : data.abandonRate > 40 ? 'text-amber-400' : 'text-emerald-400',
            },
            {
              label: 'ממוצע הזמנה',
              value: data.avgOrderValue > 0 ? `₪${(data.avgOrderValue / 100).toFixed(0)}` : '—',
              sub: 'AOV',
              color: 'text-blue-400',
            },
            {
              label: 'הזמנות החודש',
              value: data.totalOrders.toString(),
              sub: 'הזמנות ממסד הנתונים',
              color: 'text-white',
            },
          ].map((kpi, i) => (
            <div key={i} className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Funnel chart */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-white mb-1">המשפך</h2>
        <p className="text-xs text-gray-600 mb-5">נקודות נפילה גדולות מסומנות באדום</p>
        {steps.map((step, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 text-xs text-gray-400 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-gray-300">{step.label}</span>
                {step.drop !== undefined && step.drop > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${step.drop > 50 ? 'bg-red-500/20 text-red-400' : step.drop > 25 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-600'}`}>
                    −{step.drop}% נפילה
                  </span>
                )}
              </div>
              <span className="text-white font-bold text-sm">{step.value > 0 ? step.value.toLocaleString('he-IL') : '—'}</span>
            </div>
            <div className="bg-white/5 rounded-full h-3 overflow-hidden">
              <div className={`h-full ${step.color} rounded-full transition-all`}
                style={{ width: step.value > 0 ? `${Math.max(2, step.pct)}%` : '0%' }} />
            </div>
            <p className="text-xs text-gray-700 mt-1">{step.sub}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {data && (
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-white mb-1">תובנות אוטומטיות</h2>
          <p className="text-xs text-gray-600 mb-4">המלצות מבוססות על נתוני המשפך האמיתיים</p>
          <div className="space-y-3">
            {data.abandonRate > 70 && data.addToCart > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <span className="text-red-400 text-base flex-shrink-0">🔴</span>
                <div>
                  <p className="text-sm font-semibold text-red-400">{data.abandonRate}% נטישת עגלה — גבוה מאוד</p>
                  <p className="text-xs text-gray-500 mt-0.5">הפעל אוטומציית "עגלה נטושה" שתשלח תזכורת לאחר שעה. ממוצע שיפור: 15-25% בהמרות.</p>
                </div>
              </div>
            )}
            {data.checkoutStart > data.totalOrders * 2 && data.checkoutStart > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-amber-400 text-base flex-shrink-0">🟡</span>
                <div>
                  <p className="text-sm font-semibold text-amber-400">נפילה גדולה בדף תשלום</p>
                  <p className="text-xs text-gray-500 mt-0.5">{data.checkoutStart - data.totalOrders} אנשים התחילו תשלום ולא השלימו. שקול לקצר את טופס התשלום ולהוסיף ביקורות אמינות.</p>
                </div>
              </div>
            )}
            {data.totalOrders === 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="text-blue-400 text-base flex-shrink-0">💡</span>
                <div>
                  <p className="text-sm font-semibold text-blue-400">אין הזמנות עדיין</p>
                  <p className="text-xs text-gray-500 mt-0.5">ודא שמוצר קיים במסד הנתונים, שפרטי Cardcom מוגדרים, ושהחנות פתוחה לגולשים.</p>
                </div>
              </div>
            )}
            {data.totalOrders > 0 && data.abandonRate <= 70 && (
              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-emerald-400 text-base flex-shrink-0">✅</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">המשפך עובד</p>
                  <p className="text-xs text-gray-500 mt-0.5">שיעור ההמרה סביר. המשך לנטר ולשפר עם A/B על כפתורים ותמונות.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data source note */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-gray-500 text-base flex-shrink-0">📊</span>
        <p className="text-xs text-gray-600">
          שלב 1 (ביקורי מוצר, עגלה, תשלום) מגיע מ-<strong className="text-gray-500">VisitorEvent tracking</strong>.
          שלב 4 (רכישות) מגיע ממסד ההזמנות. ככל שיותר גולשים יגיעו לחנות, הנתונים יהיו מדויקים יותר.
        </p>
      </div>
    </div>
  )
}
