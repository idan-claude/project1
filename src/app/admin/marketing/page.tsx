'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'

interface Coupon {
  _id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  maxUses: number | null
  uses: number
  active: boolean
  expiresAt: string | null
}

export default function MarketingPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then(r => r.json())
      .then(d => { setCoupons(Array.isArray(d) ? d : d.coupons ?? []); setLoading(false) })
  }, [])

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    })
    setCoupons(prev => prev.map(c => c._id === id ? { ...c, active: !current } : c))
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">שיווק</h1>
          <p className="text-sm text-gray-500 mt-0.5">קופונים, קמפיינים וקידום מכירות</p>
        </div>
        <Link href="/admin/coupons/new"
          className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors">
          + קופון חדש
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-black text-white">{coupons.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">קופונים סה"כ</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-black text-emerald-400">{coupons.filter(c => c.active).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">פעילים</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-black text-blue-400">{coupons.reduce((a, c) => a + c.uses, 0)}</p>
          <p className="text-xs text-gray-500 mt-0.5">שימושים כולל</p>
        </div>
      </div>

      {/* Coupons table */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">קופוני הנחה</h2>
          <Link href="/admin/coupons" className="text-xs text-blue-400 hover:underline">ניהול מלא ←</Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 text-sm">אין קופונים עדיין</p>
            <Link href="/admin/coupons/new" className="text-blue-400 text-sm hover:underline mt-2 inline-block">צור קופון ראשון</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-white/5">
                <th className="text-right px-4 py-2.5 font-medium">קוד</th>
                <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">הנחה</th>
                <th className="text-right px-4 py-2.5 font-medium">שימושים</th>
                <th className="text-right px-4 py-2.5 font-medium">פעיל</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.map(c => (
                <tr key={c._id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="font-mono text-white text-[13px] font-bold">{c.code}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-400 text-[13px]">
                    {c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)}
                    {c.minOrder > 0 && <span className="text-gray-600 text-[11px] mr-1">מינ׳ {formatPrice(c.minOrder)}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[13px]">
                    {c.uses}{c.maxUses ? `/${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c._id, c.active)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.active ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${c.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Coming soon modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: 'קמפיינים', sub: 'שלח אימייל / SMS לקהל יעד', icon: '📣' },
          { title: 'אוטומציות שיווק', sub: 'רצפי מיילים לאחר רכישה', icon: '⚡' },
          { title: 'A/B Testing', sub: 'בדוק גרסאות שונות של דפים', icon: '🔬' },
          { title: 'תוכנית שותפים', sub: 'מעקב קישורי הפניה', icon: '🤝' },
        ].map(m => (
          <div key={m.title} className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex items-center gap-3 opacity-60">
            <span className="text-2xl">{m.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{m.title}</p>
              <p className="text-xs text-gray-600">{m.sub}</p>
            </div>
            <span className="mr-auto text-[10px] text-gray-600 border border-white/10 px-2 py-0.5 rounded-full">בקרוב</span>
          </div>
        ))}
      </div>
    </div>
  )
}
