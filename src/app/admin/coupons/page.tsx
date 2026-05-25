'use client'
import { useEffect, useState } from 'react'

interface Coupon {
  _id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  uses: number
  maxUses: number | null
  active: boolean
  expiresAt: string | null
  minOrder: number | null
}

const EMPTY_FORM = { code: '', type: 'percent', value: '', maxUses: '', minOrder: '', expiresAt: '' }

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/admin/coupons/${coupon._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    })
    load()
  }

  async function deleteCoupon(id: string) {
    if (!confirm('למחוק קופון זה?')) return
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    load()
  }

  async function createCoupon() {
    if (!form.code || !form.value) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value) * (form.type === 'fixed' ? 100 : 1),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        minOrder: form.minOrder ? Number(form.minOrder) * 100 : null,
        expiresAt: form.expiresAt || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'שגיאה'); return }
    setShowForm(false)
    setForm(EMPTY_FORM)
    load()
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">קופונים</h1>
          <p className="text-sm text-gray-500">{coupons.filter((c) => c.active).length} פעילים</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
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
                placeholder="SAVE10" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
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
                type="number" min="0" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">מקסימום שימושים (ריק = ללא הגבלה)</label>
              <input value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                type="number" min="0" placeholder="ללא הגבלה" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">הזמנה מינימלית (₪)</label>
              <input value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                type="number" min="0" placeholder="ללא מינימום" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">תפוגה (ריק = ללא)</label>
              <input value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                type="date" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={createCoupon} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
              {saving ? 'שומר...' : 'צור קופון'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🎟️</p>
          <p className="text-gray-600 font-semibold">אין קופונים עדיין</p>
          <p className="text-xs text-gray-400 mt-1">לחץ "+ צור קופון" כדי להוסיף את הראשון</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div key={coupon._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎟️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-gray-900 text-lg">{coupon.code}</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {coupon.active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span>הנחה: {coupon.type === 'percent' ? `${coupon.value}%` : `₪${(coupon.value / 100).toFixed(0)}`}</span>
                  <span>שימושים: {coupon.uses}{coupon.maxUses ? `/${coupon.maxUses}` : ''}</span>
                  {coupon.minOrder && <span>מינימום: ₪{(coupon.minOrder / 100).toFixed(0)}</span>}
                  {coupon.expiresAt && <span>תפוגה: {new Date(coupon.expiresAt).toLocaleDateString('he-IL')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(coupon)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${coupon.active ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                  {coupon.active ? 'השהה' : 'הפעל'}
                </button>
                <button onClick={() => deleteCoupon(coupon._id)}
                  className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
