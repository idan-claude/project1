'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    const res = await fetch(`/api/admin/products?search=${q}&limit=30`)
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">מוצרים ({total})</h1>
        <div className="flex gap-3">
          <Link href="/admin/import">
            <Button variant="secondary" size="sm">ייבא מ-AliExpress</Button>
          </Link>
          <Link href="/admin/products/new">
            <Button size="sm">+ מוצר חדש</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="חיפוש מוצר..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">מוצר</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">מחיר</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">מלאי</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">סטטוס</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">טוען...</td></tr>
            )}
            {!loading && products.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">לא נמצאו מוצרים</td></tr>
            )}
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {p.images?.[0]?.url && <Image src={p.images[0].url} alt="" width={40} height={40} className="object-cover" />}
                    </div>
                    <span className="font-medium text-gray-900">{p.nameHe}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(p.pricing?.sellingPrice || 0)}</td>
                <td className="px-4 py-3 text-gray-700">{p.inventory?.quantity ?? '—'}</td>
                <td className="px-4 py-3"><Badge status={p.status} /></td>
                <td className="px-4 py-3">
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
    </div>
  )
}
