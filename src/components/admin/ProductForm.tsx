'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { NISToAgorot, agorotToNIS } from '@/lib/utils/formatPrice'

interface ProductFormProps {
  initial?: any
  onSave: (data: any) => Promise<void>
}

export default function ProductForm({ initial, onSave }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nameHe: initial?.nameHe || '',
    nameEn: initial?.nameEn || '',
    descriptionHe: initial?.descriptionHe || '',
    sku: initial?.sku || '',
    status: initial?.status || 'draft',
    featured: initial?.featured || false,
    sellingPriceNIS: initial ? agorotToNIS(initial.pricing?.sellingPrice || 0) : '',
    compareAtPriceNIS: initial ? agorotToNIS(initial.pricing?.compareAtPrice || 0) : '',
    costPriceNIS: initial ? agorotToNIS(initial.pricing?.costPrice || 0) : '',
    quantity: initial?.inventory?.quantity ?? 0,
    trackQuantity: initial?.inventory?.trackQuantity ?? true,
    imageUrl: initial?.images?.[0]?.url || '',
    metaTitle: initial?.seo?.metaTitle || '',
    metaDescription: initial?.seo?.metaDescription || '',
  })

  function set(key: string, value: unknown) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      nameHe: form.nameHe,
      nameEn: form.nameEn,
      descriptionHe: form.descriptionHe,
      sku: form.sku,
      status: form.status,
      featured: form.featured,
      pricing: {
        sellingPrice: NISToAgorot(Number(form.sellingPriceNIS)),
        compareAtPrice: NISToAgorot(Number(form.compareAtPriceNIS) || 0),
        costPrice: NISToAgorot(Number(form.costPriceNIS) || 0),
        vatIncluded: true,
      },
      inventory: {
        trackQuantity: form.trackQuantity,
        quantity: Number(form.quantity),
        lowStockThreshold: 5,
      },
      images: form.imageUrl ? [{ url: form.imageUrl, alt: form.nameHe }] : [],
      seo: { metaTitle: form.metaTitle, metaDescription: form.metaDescription },
    })
    setSaving(false)
    router.push('/admin/products')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">פרטי מוצר</h2>
        <Input label="שם בעברית *" value={form.nameHe} onChange={(e) => set('nameHe', e.target.value)} required />
        <Input label="שם באנגלית (אופציונלי)" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">תיאור</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={form.descriptionHe}
            onChange={(e) => set('descriptionHe', e.target.value)}
          />
        </div>
        <Input label="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">תמונות</h2>
        <Input label="כתובת URL של תמונה ראשית" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">מחיר</h2>
        <div className="grid grid-cols-3 gap-4">
          <Input label="מחיר מכירה (₪) *" type="number" min="0" step="0.01" value={form.sellingPriceNIS} onChange={(e) => set('sellingPriceNIS', e.target.value)} required />
          <Input label="מחיר מחוק (₪)" type="number" min="0" step="0.01" value={form.compareAtPriceNIS} onChange={(e) => set('compareAtPriceNIS', e.target.value)} />
          <Input label="עלות (₪)" type="number" min="0" step="0.01" value={form.costPriceNIS} onChange={(e) => set('costPriceNIS', e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">מלאי</h2>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="trackQty" checked={form.trackQuantity} onChange={(e) => set('trackQuantity', e.target.checked)} className="rounded" />
          <label htmlFor="trackQty" className="text-sm text-gray-700">מעקב אחר כמות</label>
        </div>
        {form.trackQuantity && (
          <Input label="כמות במלאי" type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        )}
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">הגדרות</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">סטטוס</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="draft">טיוטה</option>
            <option value="active">פעיל</option>
            <option value="archived">בארכיון</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="rounded" />
          <label htmlFor="featured" className="text-sm text-gray-700">מוצר מוצג בדף הבית</label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={saving} size="lg">שמור מוצר</Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>ביטול</Button>
      </div>
    </form>
  )
}
