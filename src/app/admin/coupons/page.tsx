'use client'
import { useState } from 'react'

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  uses: number
  maxUses: number | null
  active: boolean
  expiresAt: string | null
  minOrder: number | null
}

const MOCK_COUPONS: Coupon[] = [
  { id: '1', code: 'WELCOME10', type: 'percent', value: 10, uses: 47, maxUses: null, active: true, expiresAt: null, minOrder: null },
  { id: '2', code: 'SUMMER50', type: 'fixed', value: 5000, uses: 12, maxUses: 50, active: true, expiresAt: '2026-08-31', minOrder: 19900 },
  { id: '3', code: 'VIP20', type: 'percent', value: 20, uses: 8, maxUses: 20, active: false, expiresAt: '2026-04-30', minOrder: null },
]

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percent', value: '', maxUses: '', minOrder: '', expiresAt: '' })

  const toggleActive = (id: string) => {
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c))
  }

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id))
  }

  const createCoupon = () => {
    if (!form.code || !form.value) return
    const newCoupon: Coupon = {
      id: String(Date.now()),
      code: form.code.toUpperCase(),
      type: form.type as 'percent' | 'fixed',
      value: Number(form.value) * (form.type === 'fixed' ? 100 : 1),
      uses: 0,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      active: true,
      expiresAt: form.expiresAt || null,
      minOrder: form.minOrder ? Number(form.minOrder) * 100 : null,
    }
    setCoupons((prev) => [newCoupon, ...prev])
    setShowForm(false)
    setForm({ code: '', type: 'percent', value: '', maxUses: '', minOrder: '', expiresAt: '' })
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">קופונים</h1>
          <p className="text-sm text-gray-500">{coupons.filter((c) => c.active).length} קופונים פעילים</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          + צור קופון
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">קופון חדש</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">קוד קופון</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER50" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">סוג</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="percent">אחוז הנחה</option>
                <option value="fixed">סכום קבוע (₪)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">ערך ({form.type === 'percent' ? '%' : '₪'})</label>
              <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                type="number" placeholder={form.type === 'percent' ? '10' : '50'} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">מקסימום שימושים (ריק = ללא הגבלה)</label>
              <input value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                type="number" placeholder="100" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">הזמנה מינימלית (₪)</label>
              <input value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                type="number" placeholder="150" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">תפוגה (ריק = ללא)</label>
              <input value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                type="date" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createCoupon} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              צור קופון
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎟️</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono font-bold text-gray-900 text-lg">{coupon.code}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {coupon.active ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>
                  הנחה: {coupon.type === 'percent' ? `${coupon.value}%` : `₪${(coupon.value / 100).toFixed(0)}`}
                </span>
                <span>שימושים: {coupon.uses}{coupon.maxUses ? `/${coupon.maxUses}` : ''}</span>
                {coupon.minOrder && <span>מינימום: ₪{(coupon.minOrder / 100).toFixed(0)}</span>}
                {coupon.expiresAt && <span>תפוגה: {coupon.expiresAt}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => toggleActive(coupon.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  coupon.active ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {coupon.active ? 'השהה' : 'הפעל'}
              </button>
              <button
                onClick={() => deleteCoupon(coupon.id)}
                className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
