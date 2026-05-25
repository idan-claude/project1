'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'

type StatusFilter = 'all' | 'active' | 'draft' | 'archived'

const STATUS_LABEL: Record<string, string> = { active: 'פעיל', draft: 'טיוטה', archived: 'ארכיון' }
const STATUS_CLR: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  draft: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  archived: 'bg-gray-500/15 text-gray-500 border-gray-500/20',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  async function load(q = '', st = statusFilter) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (q) params.set('search', q)
      if (st !== 'all') params.set('status', st)
      const res = await fetch(`/api/admin/products?${params}`)
      if (!res.ok) { setProducts([]); setTotal(0); return }
      const data = await res.json()
      setProducts(data.products || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`לארכב את "${name}"?`)) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    load(search)
  }

  async function handleDuplicate(id: string) {
    setDuplicating(id)
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' })
      if (res.ok) load(search)
    } finally {
      setDuplicating(null)
    }
  }

  function handleStatusFilter(st: StatusFilter) {
    setStatusFilter(st)
    load(search, st)
  }

  const p = products as Array<{
    _id: string; nameHe: string; status: string; sku: string;
    images?: Array<{ url: string }>; pricing?: { sellingPrice: number }; inventory?: { quantity: number }
  }>

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">מוצרים {total > 0 && <span className="text-gray-500 font-normal text-base">({total})</span>}</h1>
          <p className="text-sm text-gray-600 mt-0.5">נהל מוצרים, מחירים, מלאי ותמונות</p>
        </div>
        <div className="flex gap-2 sm:mr-auto">
          <Link href="/admin/import">
            <button className="bg-[#0E1525] border border-white/10 text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors">
              ⬇ ייבא מ-AliExpress
            </button>
          </Link>
          <Link href="/admin/products/new">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              + מוצר חדש
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <input
            className="w-full bg-[#0E1525] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60"
            placeholder="חיפוש מוצר..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(search)}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'draft', 'archived'] as StatusFilter[]).map(st => (
            <button
              key={st}
              onClick={() => handleStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-500 hover:text-gray-300'
              }`}
            >
              {st === 'all' ? 'הכל' : STATUS_LABEL[st]}
            </button>
          ))}
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[#0E1525] rounded-2xl p-4 animate-pulse h-16" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && p.length === 0 && (
        <div className="text-center py-20 bg-[#0E1525] border border-white/5 rounded-2xl">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-300 font-semibold">אין מוצרים</p>
          <p className="text-xs text-gray-600 mt-1 mb-5">
            {statusFilter !== 'all' ? `אין מוצרים בסטטוס "${STATUS_LABEL[statusFilter]}"` : 'ייבא מ-AliExpress או הוסף ידנית'}
          </p>
          <Link href="/admin/products/new">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl">+ מוצר חדש</button>
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && p.length > 0 && (
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl overflow-hidden">
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            {p.map((prod) => (
              <div key={prod._id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#080C16] border border-white/5 flex-shrink-0 flex items-center justify-center text-xl">
                    {prod.images?.[0]?.url
                      ? <img src={prod.images[0].url} alt="" className="w-full h-full object-cover" />
                      : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{prod.nameHe}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${STATUS_CLR[prod.status] || STATUS_CLR.draft}`}>
                        {STATUS_LABEL[prod.status] || prod.status}
                      </span>
                      <span className="text-xs text-gray-600">מלאי: {prod.inventory?.quantity ?? '—'}</span>
                    </div>
                  </div>
                  <p className="font-bold text-white flex-shrink-0 text-sm">{formatPrice(prod.pricing?.sellingPrice || 0)}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/products/${prod._id}`} className="flex-1">
                    <button className="w-full bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium py-2 rounded-lg transition-colors">עריכה</button>
                  </Link>
                  <button
                    onClick={() => handleDuplicate(prod._id)}
                    disabled={duplicating === prod._id}
                    className="bg-white/5 hover:bg-white/10 text-gray-400 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {duplicating === prod._id ? '⏳' : 'שכפל'}
                  </button>
                  <button onClick={() => handleDelete(prod._id, prod.nameHe)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg transition-colors">
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <table className="w-full text-sm hidden md:table">
            <thead className="border-b border-white/5">
              <tr>
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">מוצר</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">מחיר</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">מלאי</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">סטטוס</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {p.map((prod) => (
                <tr key={prod._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#080C16] border border-white/5 flex-shrink-0 flex items-center justify-center text-lg">
                        {prod.images?.[0]?.url
                          ? <img src={prod.images[0].url} alt="" className="w-full h-full object-cover" />
                          : '📦'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{prod.nameHe}</p>
                        {prod.sku && <p className="text-xs text-gray-600 mt-0.5">SKU: {prod.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-white">{formatPrice(prod.pricing?.sellingPrice || 0)}</td>
                  <td className="px-5 py-3.5">
                    {prod.inventory?.quantity !== undefined ? (
                      <span className={`text-sm font-medium ${prod.inventory.quantity <= 0 ? 'text-red-400' : prod.inventory.quantity <= 20 ? 'text-amber-400' : 'text-gray-300'}`}>
                        {prod.inventory.quantity}
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${STATUS_CLR[prod.status] || STATUS_CLR.draft}`}>
                      {STATUS_LABEL[prod.status] || prod.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 justify-end">
                      <Link href={`/admin/products/${prod._id}`}>
                        <button className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors">עריכה</button>
                      </Link>
                      <button
                        onClick={() => handleDuplicate(prod._id)}
                        disabled={duplicating === prod._id}
                        title="שכפל מוצר"
                        className="bg-white/5 hover:bg-white/10 text-gray-500 hover:text-gray-300 text-xs px-2 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {duplicating === prod._id ? '⏳' : '⧉'}
                      </button>
                      <button
                        onClick={() => handleDelete(prod._id, prod.nameHe)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-2 py-1.5 rounded-lg transition-colors"
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
