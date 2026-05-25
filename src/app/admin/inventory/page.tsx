'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'

interface InventoryItem {
  _id: string
  nameHe: string
  slug: string
  sku: string
  status: string
  quantity: number
  lowStockThreshold: number
  trackQuantity: boolean
  sellingPrice: number
  stockStatus: 'ok' | 'low' | 'out' | 'untracked'
}

interface Summary { total: number; outOfStock: number; lowStock: number; healthy: number }

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ok: { label: 'תקין', cls: 'bg-emerald-500/15 text-emerald-400' },
  low: { label: 'מלאי נמוך', cls: 'bg-amber-500/15 text-amber-400' },
  out: { label: 'אזל', cls: 'bg-red-500/15 text-red-400' },
  untracked: { label: 'לא במעקב', cls: 'bg-gray-500/15 text-gray-400' },
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/inventory')
    const d = await r.json()
    setItems(d.items)
    setSummary(d.summary)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter(i => {
    if (filter === 'low') return i.stockStatus === 'low'
    if (filter === 'out') return i.stockStatus === 'out'
    return true
  })

  async function saveQty(id: string) {
    const qty = parseInt(editVal)
    if (isNaN(qty) || qty < 0) return
    setSaving(true)
    await fetch('/api/admin/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, quantity: qty }),
    })
    await load()
    setEditing(null)
    setSaving(false)
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">ניהול מלאי</h1>
        <p className="text-sm text-gray-500 mt-0.5">כמויות ריאלטיים מהמסד — עריכה ישירה</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'סה"כ מוצרים', val: summary.total, cls: 'text-white' },
            { label: 'תקינים', val: summary.healthy, cls: 'text-emerald-400' },
            { label: 'מלאי נמוך', val: summary.lowStock, cls: 'text-amber-400' },
            { label: 'אזל מהמלאי', val: summary.outOfStock, cls: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
              <p className={`text-2xl font-black ${s.cls}`}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {([['all', 'הכל'], ['low', 'מלאי נמוך'], ['out', 'אזל']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === k ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600">אין מוצרים בקטגוריה זו</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-600 text-xs">
                <th className="text-right px-4 py-3 font-medium">מוצר</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">מחיר</th>
                <th className="text-right px-4 py-3 font-medium">סטטוס</th>
                <th className="text-right px-4 py-3 font-medium">כמות</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(item => {
                const st = STATUS_LABELS[item.stockStatus]
                return (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-[13px] truncate max-w-[180px]">{item.nameHe}</p>
                      <p className="text-gray-600 text-[11px] mt-0.5">{item.sku}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-400 text-[13px]">
                      {formatPrice(item.sellingPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editing === item._id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            className="w-16 bg-[#1A2235] border border-blue-500/40 rounded px-2 py-1 text-white text-sm text-center"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') saveQty(item._id); if (e.key === 'Escape') setEditing(null) }}
                          />
                          <button onClick={() => saveQty(item._id)} disabled={saving}
                            className="text-emerald-400 hover:text-emerald-300 text-xs font-bold px-1">✓</button>
                          <button onClick={() => setEditing(null)} className="text-gray-600 hover:text-gray-400 text-xs px-1">✕</button>
                        </div>
                      ) : (
                        <span className="text-white font-mono font-bold">{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button
                        onClick={() => { setEditing(item._id); setEditVal(String(item.quantity)) }}
                        className="text-gray-600 hover:text-blue-400 text-xs transition-colors"
                      >
                        עריכה
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
