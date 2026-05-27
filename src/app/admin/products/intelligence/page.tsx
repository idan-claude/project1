'use client'
import { useEffect, useState } from 'react'

interface ProductIntelligence {
  slug: string
  name: string
  image: string
  stock: number | null
  price: number
  views: number
  addToCarts: number
  checkoutStarts: number
  paidOrders: number
  revenue: number
  units: number
  galleryViews: number
  faqOpens: number
  rageClicks: number
  avgScroll: number
  mobileRate: number
  uniqueVisitors: number
  cartRate: number
  checkoutRate: number
  purchaseRate: number
  overallConversion: number
  insights: string[]
}

function MiniBar({ value, max, color = 'indigo' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <div className="h-1 bg-white/5 rounded-full overflow-hidden w-16">
      <div className={`h-full ${colorMap[color] || colorMap.indigo} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Metric({ label, value, suffix = '', color }: { label: string; value: string | number; suffix?: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-sm font-semibold ${color || 'text-white'}`}>{value}{suffix}</p>
      <p className="text-[9px] text-gray-600 mt-0.5">{label}</p>
    </div>
  )
}

export default function ProductIntelligencePage() {
  const [products, setProducts] = useState<ProductIntelligence[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'revenue' | 'views' | 'conversion'>('revenue')

  useEffect(() => {
    fetch('/api/admin/products/intelligence')
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setLoading(false) })
  }, [])

  const sorted = [...products].sort((a, b) => {
    if (sort === 'revenue') return b.revenue - a.revenue
    if (sort === 'views') return b.views - a.views
    return b.overallConversion - a.overallConversion
  })

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      <div className="border-b border-white/5 px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">Product Intelligence</h1>
            <p className="text-[11px] text-gray-500">ניתוח ביצועים לפי מוצר — 30 ימים</p>
          </div>
          <div className="flex gap-1">
            {(['revenue', 'views', 'conversion'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${sort === s ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-gray-500 hover:text-white hover:border-white/10'}`}
              >
                {s === 'revenue' ? 'הכנסה' : s === 'views' ? 'צפיות' : 'המרה'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {sorted.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-3xl">📊</p>
            <p className="text-gray-500 text-sm">אין נתוני מוצרים עדיין</p>
            <p className="text-gray-600 text-xs">נתונים יופיעו לאחר ביקורים בדפי מוצרים</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(p => (
              <div key={p.slug} className="bg-[#111] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-white">{p.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-gray-600 font-mono">{p.slug}</span>
                          <span className="text-[10px] text-gray-500">₪{p.price}</span>
                          {p.stock !== null && (
                            <span className={`text-[10px] ${p.stock <= 0 ? 'text-red-400' : p.stock <= 3 ? 'text-amber-400' : 'text-gray-500'}`}>
                              {p.stock <= 0 ? 'אזל' : `${p.stock} במלאי`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="flex items-center gap-6 flex-wrap">
                      <Metric label="צפיות" value={p.views.toLocaleString()} />
                      <Metric
                        label="הוספה לעגלה"
                        value={`${p.cartRate}%`}
                        color={p.cartRate >= 10 ? 'text-emerald-400' : p.cartRate >= 5 ? 'text-white' : 'text-amber-400'}
                      />
                      <Metric
                        label="checkout"
                        value={`${p.checkoutRate}%`}
                        color={p.checkoutRate >= 60 ? 'text-emerald-400' : p.checkoutRate >= 30 ? 'text-white' : 'text-amber-400'}
                      />
                      <Metric
                        label="המרה"
                        value={`${p.overallConversion}%`}
                        color={p.overallConversion > 0 ? 'text-indigo-400' : 'text-gray-500'}
                      />
                      <Metric label="הכנסה" value={`₪${p.revenue.toLocaleString()}`} color="text-white" />
                      <Metric label="יחידות" value={p.units} />
                      <Metric label="גלילה ממוצעת" value={`${p.avgScroll}%`} />
                      <Metric label="מובייל" value={`${p.mobileRate}%`} />
                    </div>

                    {/* Funnel mini-bars */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-600">צפיות</span>
                        <MiniBar value={p.views} max={Math.max(...products.map(x => x.views))} color="indigo" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-600">עגלה</span>
                        <MiniBar value={p.cartRate} max={100} color="emerald" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-gray-600">המרה</span>
                        <MiniBar value={p.overallConversion} max={Math.max(...products.map(x => x.overallConversion), 1)} color="indigo" />
                      </div>
                      {p.rageClicks > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-red-400">⚡ {p.rageClicks} rage</span>
                        </div>
                      )}
                    </div>

                    {/* Insights */}
                    {p.insights.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.insights.map((ins, i) => (
                          <span key={i} className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                            {ins}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revenue */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-semibold text-white">₪{p.revenue.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">{p.paidOrders} הזמנות</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
