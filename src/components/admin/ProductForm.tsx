'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NISToAgorot, agorotToNIS } from '@/lib/utils/formatPrice'

interface ProductImage { url: string; alt: string }
interface VariantOption { label: string; priceModifier: number; stock: number; sku: string }
interface Variant { name: string; options: VariantOption[] }

interface ProductFormProps {
  initial?: Record<string, unknown>
  onSave: (data: Record<string, unknown>) => Promise<void>
}

export default function ProductForm({ initial, onSave }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const init = initial as Record<string, unknown> & {
    pricing?: { sellingPrice?: number; compareAtPrice?: number; costPrice?: number }
    inventory?: { trackQuantity?: boolean; quantity?: number; lowStockThreshold?: number }
    images?: ProductImage[]
    variants?: Variant[]
    seo?: { metaTitle?: string; metaDescription?: string }
    shipping?: { weight?: number; freeShipping?: boolean; requiresShipping?: boolean }
  } | undefined

  const [tab, setTab] = useState<'basic' | 'images' | 'variants' | 'pricing' | 'seo' | 'shipping'>('basic')
  const [form, setForm] = useState({
    nameHe: init?.nameHe as string || '',
    nameEn: init?.nameEn as string || '',
    descriptionHe: init?.descriptionHe as string || '',
    sku: init?.sku as string || '',
    status: (init?.status as string) || 'draft',
    featured: (init?.featured as boolean) || false,
    sellingPriceNIS: init ? agorotToNIS(init.pricing?.sellingPrice || 0) : '',
    compareAtPriceNIS: init ? agorotToNIS(init.pricing?.compareAtPrice || 0) : '',
    costPriceNIS: init ? agorotToNIS(init.pricing?.costPrice || 0) : '',
    quantity: init?.inventory?.quantity ?? 0,
    trackQuantity: init?.inventory?.trackQuantity ?? true,
    lowStockThreshold: init?.inventory?.lowStockThreshold ?? 5,
    metaTitle: init?.seo?.metaTitle || '',
    metaDescription: init?.seo?.metaDescription || '',
    weight: init?.shipping?.weight ?? 0,
    freeShipping: init?.shipping?.freeShipping ?? true,
    requiresShipping: init?.shipping?.requiresShipping ?? true,
  })
  const [images, setImages] = useState<ProductImage[]>(init?.images || [])
  const [variants, setVariants] = useState<Variant[]>(init?.variants || [])

  function set(key: string, value: unknown) {
    setForm(p => ({ ...p, [key]: value }))
  }

  async function uploadFile(file: File, idx?: number) {
    if (!file.type.startsWith('image/')) return
    setUploadingIdx(idx ?? images.length)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'שגיאה בהעלאה'); return }
      if (idx !== undefined) {
        setImages(prev => prev.map((img, i) => i === idx ? { ...img, url: data.url } : img))
      } else {
        setImages(prev => [...prev, { url: data.url, alt: form.nameHe || file.name }])
      }
    } finally {
      setUploadingIdx(null)
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    Array.from(e.dataTransfer.files).forEach(f => uploadFile(f))
  }

  function moveImage(from: number, to: number) {
    setImages(prev => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  function addVariant() {
    setVariants(prev => [...prev, { name: '', options: [{ label: '', priceModifier: 0, stock: 0, sku: '' }] }])
  }

  function removeVariant(vi: number) {
    setVariants(prev => prev.filter((_, i) => i !== vi))
  }

  function setVariantName(vi: number, name: string) {
    setVariants(prev => prev.map((v, i) => i === vi ? { ...v, name } : v))
  }

  function addOption(vi: number) {
    setVariants(prev => prev.map((v, i) => i === vi
      ? { ...v, options: [...v.options, { label: '', priceModifier: 0, stock: 0, sku: '' }] }
      : v))
  }

  function removeOption(vi: number, oi: number) {
    setVariants(prev => prev.map((v, i) => i === vi
      ? { ...v, options: v.options.filter((_, j) => j !== oi) }
      : v))
  }

  function setOption(vi: number, oi: number, key: keyof VariantOption, value: string | number) {
    setVariants(prev => prev.map((v, i) => i === vi
      ? { ...v, options: v.options.map((opt, j) => j === oi ? { ...opt, [key]: value } : opt) }
      : v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nameHe.trim()) { alert('שם מוצר חובה'); return }
    if (!form.sellingPriceNIS) { alert('מחיר חובה'); return }
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
        lowStockThreshold: Number(form.lowStockThreshold),
      },
      images,
      variants,
      seo: { metaTitle: form.metaTitle, metaDescription: form.metaDescription },
      shipping: {
        weight: Number(form.weight),
        freeShipping: form.freeShipping,
        requiresShipping: form.requiresShipping,
      },
    })
    setSaving(false)
    router.push('/admin/products')
  }

  const tabs = [
    { id: 'basic', label: 'פרטים' },
    { id: 'images', label: `תמונות ${images.length > 0 ? `(${images.length})` : ''}` },
    { id: 'variants', label: `וריאנטים ${variants.length > 0 ? `(${variants.length})` : ''}` },
    { id: 'pricing', label: 'מחיר ומלאי' },
    { id: 'seo', label: 'SEO' },
    { id: 'shipping', label: 'משלוח' },
  ] as const

  const inputCls = 'w-full bg-[#080C16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40'
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5'
  const cardCls = 'bg-[#0E1525] border border-white/5 rounded-2xl p-5 space-y-4'

  return (
    <form onSubmit={handleSubmit} dir="rtl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Basic */}
      {tab === 'basic' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">פרטי המוצר</h3>
            <p className="text-xs text-gray-600 -mt-2">שם טוב משפיע על SEO ועל שיעור ההמרה</p>
            <div>
              <label className={labelCls}>שם בעברית *</label>
              <input className={inputCls} value={form.nameHe} onChange={e => set('nameHe', e.target.value)} placeholder="כרטיס מעקב FindCard PRO" required />
            </div>
            <div>
              <label className={labelCls}>שם באנגלית</label>
              <input className={inputCls} value={form.nameEn} onChange={e => set('nameEn', e.target.value)} placeholder="FindCard PRO Tracking Card" />
            </div>
            <div>
              <label className={labelCls}>תיאור מוצר</label>
              <p className="text-xs text-gray-600 mb-1.5">תיאור טוב מגדיל המרות — כתוב יתרונות, לא רק תכונות</p>
              <textarea
                className={`${inputCls} resize-none`}
                rows={5}
                value={form.descriptionHe}
                onChange={e => set('descriptionHe', e.target.value)}
                placeholder="תאר את המוצר בצורה משכנעת..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>SKU</label>
                <input className={inputCls} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="FC-PRO-001" />
              </div>
              <div>
                <label className={labelCls}>סטטוס</label>
                <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">פעיל — מוצג בחנות</option>
                  <option value="draft">טיוטה — נסתר</option>
                  <option value="archived">בארכיון</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.featured ? 'bg-blue-600' : 'bg-gray-700'}`}
                onClick={() => set('featured', !form.featured)}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">הצג בדף הבית (מוצר מומלץ)</span>
            </label>
          </div>
        </div>
      )}

      {/* Images */}
      {tab === 'images' && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white">גלריית תמונות</h3>
          <p className="text-xs text-gray-600 -mt-2">הגרר תמונות לסידור מחדש · תמונה ראשונה = תמונה ראשית</p>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
          >
            <p className="text-3xl mb-2">🖼️</p>
            <p className="text-sm text-gray-400">גרור תמונות לכאן או <span className="text-blue-400 underline">בחר קבצים</span></p>
            <p className="text-xs text-gray-600 mt-1">JPG, PNG, WebP עד 10MB לקובץ</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => Array.from(e.target.files || []).forEach(f => uploadFile(f))}
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <div className={`aspect-square rounded-xl overflow-hidden bg-[#080C16] border ${i === 0 ? 'border-blue-500/50' : 'border-white/5'}`}>
                    {uploadingIdx === i ? (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        <span className="animate-spin text-xl">⏳</span>
                      </div>
                    ) : (
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                    )}
                  </div>
                  {i === 0 && <span className="absolute top-1 right-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">ראשית</span>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                    {i > 0 && (
                      <button type="button" onClick={() => moveImage(i, i - 1)}
                        className="bg-white/20 hover:bg-white/30 text-white rounded-lg w-7 h-7 text-sm flex items-center justify-center">←</button>
                    )}
                    <button type="button" onClick={() => removeImage(i)}
                      className="bg-red-500/80 hover:bg-red-600 text-white rounded-lg w-7 h-7 text-sm flex items-center justify-center">✕</button>
                    {i < images.length - 1 && (
                      <button type="button" onClick={() => moveImage(i, i + 1)}
                        className="bg-white/20 hover:bg-white/30 text-white rounded-lg w-7 h-7 text-sm flex items-center justify-center">→</button>
                    )}
                  </div>
                </div>
              ))}
              {/* Upload more */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-white/10 hover:border-white/20 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors text-2xl"
              >+</button>
            </div>
          )}
        </div>
      )}

      {/* Variants */}
      {tab === 'variants' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">וריאנטים</h3>
                <p className="text-xs text-gray-600">צבע, מידה, חבילה — כל וריאנט יכול להיות במחיר שונה</p>
              </div>
              <button type="button" onClick={addVariant}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                + הוסף וריאנט
              </button>
            </div>

            {variants.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">
                <p className="text-2xl mb-2">📦</p>
                <p>אין וריאנטים — המוצר ייצא כמוצר יחיד</p>
              </div>
            )}

            {variants.map((v, vi) => (
              <div key={vi} className="bg-[#080C16] rounded-xl border border-white/5 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    className={`${inputCls} flex-1`}
                    value={v.name}
                    onChange={e => setVariantName(vi, e.target.value)}
                    placeholder="שם הוריאנט (לדוג': צבע, מידה, חבילה)"
                  />
                  <button type="button" onClick={() => removeVariant(vi)}
                    className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
                </div>
                <div className="space-y-2">
                  {v.options.map((opt, oi) => (
                    <div key={oi} className="grid grid-cols-4 gap-2 items-center">
                      <input className={inputCls} value={opt.label} onChange={e => setOption(vi, oi, 'label', e.target.value)} placeholder="שם (לדוג': כחול)" />
                      <input className={inputCls} type="number" value={opt.priceModifier} onChange={e => setOption(vi, oi, 'priceModifier', Number(e.target.value))} placeholder="תוספת ₪" />
                      <input className={inputCls} type="number" min="0" value={opt.stock} onChange={e => setOption(vi, oi, 'stock', Number(e.target.value))} placeholder="מלאי" />
                      <div className="flex gap-1">
                        <input className={inputCls} value={opt.sku} onChange={e => setOption(vi, oi, 'sku', e.target.value)} placeholder="SKU" />
                        <button type="button" onClick={() => removeOption(vi, oi)} className="text-red-400 hover:text-red-300 text-xs px-1.5">✕</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(vi)}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1">+ הוסף אפשרות</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      {tab === 'pricing' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">תמחור</h3>
            <p className="text-xs text-gray-600 -mt-2">מחיר מחוק מייצר תחושת "עסקה" ומגדיל המרות</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>מחיר מכירה (₪) *</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.sellingPriceNIS}
                  onChange={e => set('sellingPriceNIS', e.target.value)} required placeholder="199.90" />
              </div>
              <div>
                <label className={labelCls}>מחיר מחוק (₪)</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.compareAtPriceNIS}
                  onChange={e => set('compareAtPriceNIS', e.target.value)} placeholder="298.90" />
              </div>
              <div>
                <label className={labelCls}>עלות (₪)</label>
                <p className="text-xs text-gray-600 mb-1.5">לא מוצג ללקוח — לחישוב רווחיות</p>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.costPriceNIS}
                  onChange={e => set('costPriceNIS', e.target.value)} placeholder="30.00" />
              </div>
            </div>
            {form.sellingPriceNIS && form.costPriceNIS && Number(form.costPriceNIS) > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                רווח: ₪{(Number(form.sellingPriceNIS) - Number(form.costPriceNIS)).toFixed(2)}
                ({Math.round(((Number(form.sellingPriceNIS) - Number(form.costPriceNIS)) / Number(form.sellingPriceNIS)) * 100)}% מרווח)
              </div>
            )}
          </div>

          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">מלאי</h3>
            <p className="text-xs text-gray-600 -mt-2">מלאי נמוך יוצר תחושת דחיפות ומגדיל המרות</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.trackQuantity ? 'bg-blue-600' : 'bg-gray-700'}`}
                onClick={() => set('trackQuantity', !form.trackQuantity)}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.trackQuantity ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">מעקב כמות במלאי</span>
            </label>
            {form.trackQuantity && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>כמות במלאי</label>
                  <input className={inputCls} type="number" min="0" value={form.quantity}
                    onChange={e => set('quantity', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>סף התראת מלאי נמוך</label>
                  <input className={inputCls} type="number" min="0" value={form.lowStockThreshold}
                    onChange={e => set('lowStockThreshold', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEO */}
      {tab === 'seo' && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white">הגדרות SEO</h3>
          <p className="text-xs text-gray-600 -mt-2">טייטל ותיאור טובים מגדילים קליקים מגוגל ב-20-40%</p>
          <div>
            <label className={labelCls}>כותרת META (עד 60 תווים)</label>
            <input className={inputCls} value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)}
              placeholder={`${form.nameHe} — FindCard`} maxLength={60} />
            <p className="text-xs text-gray-600 mt-1">{form.metaTitle.length}/60 תווים</p>
          </div>
          <div>
            <label className={labelCls}>תיאור META (עד 160 תווים)</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.metaDescription}
              onChange={e => set('metaDescription', e.target.value)}
              placeholder="תיאור קצר שיופיע בתוצאות גוגל..." maxLength={160} />
            <p className="text-xs text-gray-600 mt-1">{form.metaDescription.length}/160 תווים</p>
          </div>
          {form.nameHe && (
            <div className="bg-white rounded-xl p-4 mt-2">
              <p className="text-blue-700 font-medium text-sm">{form.metaTitle || `${form.nameHe} — FindCard`}</p>
              <p className="text-green-700 text-xs">findcard.co.il/product</p>
              <p className="text-gray-600 text-xs mt-1">{form.metaDescription || form.descriptionHe?.slice(0, 160) || 'תיאור המוצר...'}</p>
            </div>
          )}
        </div>
      )}

      {/* Shipping */}
      {tab === 'shipping' && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white">הגדרות משלוח</h3>
          <p className="text-xs text-gray-600 -mt-2">משלוח חינם ומוצג בולט מגדיל המרות ב-30%</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative w-10 h-5 rounded-full transition-colors ${form.requiresShipping ? 'bg-blue-600' : 'bg-gray-700'}`}
              onClick={() => set('requiresShipping', !form.requiresShipping)}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.requiresShipping ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-300">מוצר פיזי — דורש משלוח</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative w-10 h-5 rounded-full transition-colors ${form.freeShipping ? 'bg-emerald-600' : 'bg-gray-700'}`}
              onClick={() => set('freeShipping', !form.freeShipping)}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.freeShipping ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-300">משלוח חינם</span>
          </label>
          <div>
            <label className={labelCls}>משקל (גרם)</label>
            <input className={inputCls} type="number" min="0" value={form.weight}
              onChange={e => set('weight', e.target.value)} placeholder="7" />
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/5">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {saving ? <><span className="animate-spin text-base">⏳</span> שומר...</> : '✓ שמור מוצר'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white/5 hover:bg-white/10 text-gray-300 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          ביטול
        </button>
        <span className="mr-auto text-xs text-gray-600">
          {saving ? 'שומר...' : init ? `עודכן ${new Date(init.updatedAt as string).toLocaleDateString('he-IL')}` : 'טרם נשמר'}
        </span>
      </div>
    </form>
  )
}
