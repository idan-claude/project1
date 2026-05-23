'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const DEFAULT_PRODUCT_ID = '1005010258738438' // Primary supplier product

export default function AdminImportPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [importForm, setImportForm] = useState({ nameHe: '', sellingPriceNIS: '', costPriceUSD: '' })
  const [importing, setImporting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Manual import by product ID
  const [manualId, setManualId] = useState(DEFAULT_PRODUCT_ID)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    const res = await fetch(`/api/admin/import/search?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setResults(data.products || [])
    setSearching(false)
  }

  async function handleImport(productId: string, nameHe: string, costUSD: string, sellingNIS: string) {
    setImporting(true)
    const res = await fetch('/api/admin/import/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, nameHe, sellingPriceNIS: sellingNIS, costPriceUSD: costUSD }),
    })
    if (res.ok) {
      setSuccess(true)
      setSelected(null)
      setTimeout(() => setSuccess(false), 3000)
    }
    setImporting(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">ייבוא מוצרים מ-AliExpress</h1>
      <p className="text-gray-500 text-sm mb-8">חפש מוצרים ב-AliExpress וייבא אותם לחנות שלך</p>

      {/* Manual import by ID */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-gray-900 mb-3">ייבוא לפי מזהה מוצר</h2>
        <p className="text-sm text-gray-600 mb-3">
          מוצר הספק שלך: <code className="bg-white px-2 py-0.5 rounded border text-xs">{DEFAULT_PRODUCT_ID}</code>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input placeholder="מזהה מוצר AliExpress" value={manualId} onChange={(e) => setManualId(e.target.value)} />
          <Input placeholder="שם בעברית *" value={importForm.nameHe} onChange={(e) => setImportForm((p) => ({ ...p, nameHe: e.target.value }))} />
          <Input placeholder="מחיר מכירה (₪) *" type="number" value={importForm.sellingPriceNIS} onChange={(e) => setImportForm((p) => ({ ...p, sellingPriceNIS: e.target.value }))} />
          <Input placeholder="עלות (USD)" type="number" value={importForm.costPriceUSD} onChange={(e) => setImportForm((p) => ({ ...p, costPriceUSD: e.target.value }))} />
        </div>
        {success && <p className="text-green-600 text-sm mt-2 font-medium">✓ המוצר יובא בהצלחה!</p>}
        <Button
          className="mt-3"
          loading={importing}
          onClick={() => handleImport(manualId, importForm.nameHe, importForm.costPriceUSD, importForm.sellingPriceNIS)}
          disabled={!importForm.nameHe || !importForm.sellingPriceNIS}
        >
          ייבא מוצר
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6 max-w-lg">
        <Input
          placeholder="חפש מוצרים... (באנגלית)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={searching}>חפש</Button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {results.map((p: any) => (
            <div key={p.product_id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {p.product_main_image_url && (
                <div className="relative aspect-square bg-gray-50">
                  <Image src={p.product_main_image_url} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="p-3">
                <p className="text-xs text-gray-700 line-clamp-2 mb-2">{p.product_title}</p>
                <p className="text-sm font-bold text-blue-600 mb-2">
                  ${p.target_sale_price || p.target_original_price}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setSelected(p)}
                >
                  בחר
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-gray-900 mb-4">ייבוא מוצר</h2>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{selected.product_title}</p>
            <div className="space-y-3">
              <Input label="שם בעברית *" value={importForm.nameHe} onChange={(e) => setImportForm((p) => ({ ...p, nameHe: e.target.value }))} />
              <Input label="מחיר מכירה (₪) *" type="number" value={importForm.sellingPriceNIS} onChange={(e) => setImportForm((p) => ({ ...p, sellingPriceNIS: e.target.value }))} />
              <Input label="עלות (USD)" type="number" value={importForm.costPriceUSD} onChange={(e) => setImportForm((p) => ({ ...p, costPriceUSD: e.target.value || selected.target_sale_price || '' }))} />
            </div>
            <div className="flex gap-3 mt-5">
              <Button
                loading={importing}
                onClick={() => handleImport(selected.product_id, importForm.nameHe, importForm.costPriceUSD || selected.target_sale_price, importForm.sellingPriceNIS)}
                disabled={!importForm.nameHe || !importForm.sellingPriceNIS}
              >
                ייבא מוצר
              </Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>ביטול</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
