'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(q = '') {
    setLoading(true)
    const res = await fetch(`/api/admin/products?search=${q}&limit=50`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotal(data.total || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`לארכב את "${name}"?`)) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    load(search)
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <h1 className="text-xl font-bold text-gray-900">מוצרים{total > 0 ? ` (${total})` : ''}</h1>
        <div className="flex gap-2 sm:mr-auto">
          <Link href="/admin/import">
            <Button variant="secondary" size="sm">⬇️ ייבא מ-AliExpress</Button>
          </Link>
          <Link href="/admin/products/new">
            <Button size="sm">+ חדש</Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="חיפוש מוצר..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
        />
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-600 font-semibold">אין מוצרים עדיין</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">ייבא מוצר מ-AliExpress או הוסף ידנית</p>
          <Link href="/admin/import">
            <Button size="sm">ייבא מוצר ←</Button>
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">
                    {p.images?.[0]?.url
                      ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                      : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.nameHe}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge status={p.status} />
                      <span className="text-xs text-gray-500">מלאי: {p.inventory?.quantity ?? '—'}</span>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900 flex-shrink-0">{formatPrice(p.pricing?.sellingPrice || 0)}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/products/${p._id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">עריכה</Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(p._id, p.nameHe)}>
                    מחק
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">מוצר</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">מחיר מכירה</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">מלאי</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-700">סטטוס</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-xl">
                          {p.images?.[0]?.url
                            ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                            : '📦'}
                        </div>
                        <span className="font-medium text-gray-900">{p.nameHe}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{formatPrice(p.pricing?.sellingPrice || 0)}</td>
                    <td className="px-5 py-3.5 text-gray-700">{p.inventory?.quantity ?? '—'}</td>
                    <td className="px-5 py-3.5"><Badge status={p.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/admin/products/${p._id}`}>
                          <Button variant="ghost" size="sm">עריכה</Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(p._id, p.nameHe)}>
                          מחק
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
