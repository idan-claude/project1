'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NISToAgorot, agorotToNIS } from '@/lib/utils/formatPrice'

interface ProductImage { url: string; alt: string }
interface VariantOption { label: string; priceModifier: number; stock: number; sku: string }
interface Variant { name: string; options: VariantOption[] }
interface Bundle {
  title: string
  quantity: number
  priceNIS: string
  compareAtPriceNIS: string
  badge: string
  badgeColor: string
  isRecommended: boolean
  benefits: string
  imageOverride: string
  active: boolean
}
interface PageFeature { icon: string; label: string; desc: string }
interface PageFaq { q: string; a: string }
interface TrustBadge { icon: string; text: string }

interface ProductFormProps {
  initial?: Record<string, unknown>
  onSave: (data: Record<string, unknown>) => Promise<void>
}

function psychoPrice(n: number, mode: 'x90' | 'x99' | 'round'): number {
  if (mode === 'x90') return Math.round(n / 1000) * 1000 - 10
  if (mode === 'x99') return Math.round(n / 1000) * 1000 - 1
  return Math.round(n / 100) * 100
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
    bundles?: {
      title?: string; quantity?: number; price?: number; compareAtPrice?: number
      badge?: string; badgeColor?: string; isRecommended?: boolean; benefits?: string[]
      imageOverride?: string; active?: boolean
    }[]
    pageContent?: {
      features?: { icon: string; label: string; desc: string }[]
      faqs?: { q: string; a: string }[]
      urgencyText?: string; shippingText?: string; guaranteeText?: string
      reviewRating?: number; reviewCount?: number
      trustBadges?: { icon: string; text: string }[]
    }
    beforeAfter?: { before: string; after: string; label: string }[]
  } | undefined

  const [tab, setTab] = useState<'basic' | 'images' | 'bundles' | 'pricing' | 'content' | 'seo' | 'shipping'>('basic')

  const [form, setForm] = useState({
    nameHe: init?.nameHe as string || '',
    nameEn: init?.nameEn as string || '',
    descriptionHe: init?.descriptionHe as string || '',
    sku: init?.sku as string || '',
    status: (init?.status as string) || 'draft',
    featured: (init?.featured as boolean) || false,
    sellingPriceNIS: init ? String(agorotToNIS(init.pricing?.sellingPrice || 0)) : '',
    compareAtPriceNIS: init ? String(agorotToNIS(init.pricing?.compareAtPrice || 0)) : '',
    costPriceNIS: init ? String(agorotToNIS(init.pricing?.costPrice || 0)) : '',
    quantity: init?.inventory?.quantity ?? 0,
    trackQuantity: init?.inventory?.trackQuantity ?? true,
    lowStockThreshold: init?.inventory?.lowStockThreshold ?? 5,
    metaTitle: init?.seo?.metaTitle || '',
    metaDescription: init?.seo?.metaDescription || '',
    weight: init?.shipping?.weight ?? 0,
    freeShipping: init?.shipping?.freeShipping ?? true,
    requiresShipping: init?.shipping?.requiresShipping ?? true,
    urgencyText: init?.pageContent?.urgencyText || '',
    shippingText: init?.pageContent?.shippingText || '',
    guaranteeText: init?.pageContent?.guaranteeText || '',
    reviewRating: init?.pageContent?.reviewRating ?? 0,
    reviewCount: init?.pageContent?.reviewCount ?? 0,
  })

  const [images, setImages] = useState<ProductImage[]>(init?.images || [])
  const [variants, setVariants] = useState<Variant[]>(init?.variants || [])
  const [bundles, setBundles] = useState<Bundle[]>(
    init?.bundles?.map(b => ({
      title: b.title || '',
      quantity: b.quantity || 1,
      priceNIS: String(agorotToNIS(b.price || 0)),
      compareAtPriceNIS: String(agorotToNIS(b.compareAtPrice || 0)),
      badge: b.badge || '',
      badgeColor: b.badgeColor || 'bg-blue-600',
      isRecommended: b.isRecommended ?? false,
      benefits: (b.benefits || []).join('\n'),
      imageOverride: b.imageOverride || '',
      active: b.active ?? true,
    })) || []
  )
  const [features, setFeatures] = useState<PageFeature[]>(init?.pageContent?.features || [])
  const [faqs, setFaqs] = useState<PageFaq[]>(init?.pageContent?.faqs || [])
  const [trustBadges, setTrustBadges] = useState<TrustBadge[]>(init?.pageContent?.trustBadges || [])

  function set(key: string, value: unknown) {
    setForm(p => ({ ...p, [key]: value }))
  }

  // ─── Image upload ───
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
    } finally { setUploadingIdx(null) }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    Array.from(e.dataTransfer.files).forEach(f => uploadFile(f))
  }

  function moveImage(from: number, to: number) {
    setImages(prev => { const arr = [...prev]; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); return arr })
  }

  // ─── Bundles ───
  function addBundle() {
    setBundles(prev => [...prev, { title: '', quantity: 1, priceNIS: '', compareAtPriceNIS: '', badge: '', badgeColor: 'bg-blue-600', isRecommended: false, benefits: '', imageOverride: '', active: true }])
  }

  function setBundle(i: number, key: keyof Bundle, value: string | number | boolean) {
    setBundles(prev => prev.map((b, j) => j === i ? { ...b, [key]: value } : b))
  }

  function applyPricingPreset(i: number, mode: 'x90' | 'x99' | 'round') {
    const b = bundles[i]
    const nis = parseFloat(b.priceNIS)
    if (!nis) return
    const agorot = NISToAgorot(nis)
    const snapped = psychoPrice(agorot, mode)
    setBundle(i, 'priceNIS', String(snapped / 100))
  }

  function applyBasePreset(mode: 'x90' | 'x99' | 'round') {
    const nis = parseFloat(form.sellingPriceNIS)
    if (!nis) return
    const snapped = psychoPrice(NISToAgorot(nis), mode)
    set('sellingPriceNIS', String(snapped / 100))
  }

  function applyComparePreset(mode: 'x90' | 'x99' | 'round') {
    const nis = parseFloat(form.compareAtPriceNIS)
    if (!nis) return
    const snapped = psychoPrice(NISToAgorot(nis), mode)
    set('compareAtPriceNIS', String(snapped / 100))
  }

  // ─── Features ───
  function addFeature() { setFeatures(prev => [...prev, { icon: '', label: '', desc: '' }]) }
  function setFeature(i: number, key: keyof PageFeature, value: string) {
    setFeatures(prev => prev.map((f, j) => j === i ? { ...f, [key]: value } : f))
  }

  // ─── FAQs ───
  function addFaq() { setFaqs(prev => [...prev, { q: '', a: '' }]) }
  function setFaq(i: number, key: keyof PageFaq, value: string) {
    setFaqs(prev => prev.map((f, j) => j === i ? { ...f, [key]: value } : f))
  }

  // ─── Trust badges ───
  function addBadge() { setTrustBadges(prev => [...prev, { icon: '', text: '' }]) }
  function setBadge(i: number, key: keyof TrustBadge, value: string) {
    setTrustBadges(prev => prev.map((b, j) => j === i ? { ...b, [key]: value } : b))
  }

  // ─── Variants ───
  function addVariant() { setVariants(prev => [...prev, { name: '', options: [{ label: '', priceModifier: 0, stock: 0, sku: '' }] }]) }
  function setVariantName(vi: number, name: string) { setVariants(prev => prev.map((v, i) => i === vi ? { ...v, name } : v)) }
  function addOption(vi: number) { setVariants(prev => prev.map((v, i) => i === vi ? { ...v, options: [...v.options, { label: '', priceModifier: 0, stock: 0, sku: '' }] } : v)) }
  function removeOption(vi: number, oi: number) { setVariants(prev => prev.map((v, i) => i === vi ? { ...v, options: v.options.filter((_, j) => j !== oi) } : v)) }
  function setOption(vi: number, oi: number, key: keyof VariantOption, value: string | number) {
    setVariants(prev => prev.map((v, i) => i === vi ? { ...v, options: v.options.map((opt, j) => j === oi ? { ...opt, [key]: value } : opt) } : v))
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
      bundles: bundles.map(b => ({
        title: b.title,
        quantity: Number(b.quantity),
        price: NISToAgorot(Number(b.priceNIS) || 0),
        compareAtPrice: NISToAgorot(Number(b.compareAtPriceNIS) || 0),
        badge: b.badge,
        badgeColor: b.badgeColor,
        isRecommended: b.isRecommended,
        benefits: b.benefits.split('\n').map(s => s.trim()).filter(Boolean),
        imageOverride: b.imageOverride,
        active: b.active,
      })),
      pageContent: {
        features,
        faqs,
        urgencyText: form.urgencyText,
        shippingText: form.shippingText,
        guaranteeText: form.guaranteeText,
        reviewRating: Number(form.reviewRating),
        reviewCount: Number(form.reviewCount),
        trustBadges,
      },
      images,
      variants,
      seo: { metaTitle: form.metaTitle, metaDescription: form.metaDescription },
      shipping: { weight: Number(form.weight), freeShipping: form.freeShipping, requiresShipping: form.requiresShipping },
    })
    setSaving(false)
    router.push('/admin/products')
  }

  const tabs = [
    { id: 'basic', label: 'פרטים' },
    { id: 'images', label: `תמונות${images.length > 0 ? ` (${images.length})` : ''}` },
    { id: 'bundles', label: `חבילות${bundles.length > 0 ? ` (${bundles.length})` : ''}` },
    { id: 'pricing', label: 'מחיר ומלאי' },
    { id: 'content', label: 'תוכן עמוד' },
    { id: 'seo', label: 'SEO' },
    { id: 'shipping', label: 'משלוח' },
  ] as const

  const inputCls = 'w-full bg-[#080C16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40'
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5'
  const cardCls = 'bg-[#0E1525] border border-white/5 rounded-2xl p-5 space-y-4'
  const presetBtnCls = 'text-xs px-2.5 py-1 rounded-lg font-medium transition-colors'

  return (
    <form onSubmit={handleSubmit} dir="rtl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Basic ── */}
      {tab === 'basic' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">פרטי המוצר</h3>
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
              <textarea className={`${inputCls} resize-none`} rows={5} value={form.descriptionHe} onChange={e => set('descriptionHe', e.target.value)} placeholder="תאר את המוצר בצורה משכנעת..." />
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
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.featured ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => set('featured', !form.featured)}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">הצג בדף הבית (מוצר מומלץ)</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Images ── */}
      {tab === 'images' && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white">גלריית תמונות</h3>
          <p className="text-xs text-gray-600 -mt-2">תמונה ראשונה = תמונה ראשית · גרור לסידור מחדש</p>
          <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}>
            <p className="text-3xl mb-2">🖼️</p>
            <p className="text-sm text-gray-400">גרור תמונות לכאן או <span className="text-blue-400 underline">בחר קבצים</span></p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => Array.from(e.target.files || []).forEach(f => uploadFile(f))} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <div className={`aspect-square rounded-xl overflow-hidden bg-[#080C16] border ${i === 0 ? 'border-blue-500/50' : 'border-white/5'}`}>
                    {uploadingIdx === i ? <div className="w-full h-full flex items-center justify-center text-xl">⏳</div>
                      : <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />}
                  </div>
                  {i === 0 && <span className="absolute top-1 right-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">ראשית</span>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                    {i > 0 && <button type="button" onClick={() => moveImage(i, i - 1)} className="bg-white/20 hover:bg-white/30 text-white rounded-lg w-7 h-7 text-sm flex items-center justify-center">←</button>}
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="bg-red-500/80 hover:bg-red-600 text-white rounded-lg w-7 h-7 text-sm flex items-center justify-center">✕</button>
                    {i < images.length - 1 && <button type="button" onClick={() => moveImage(i, i + 1)} className="bg-white/20 hover:bg-white/30 text-white rounded-lg w-7 h-7 text-sm flex items-center justify-center">→</button>}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-white/10 hover:border-white/20 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors text-2xl">+</button>
            </div>
          )}
        </div>
      )}

      {/* ── Bundles ── */}
      {tab === 'bundles' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">ניהול חבילות</h3>
                <p className="text-xs text-gray-500 mt-1">כל חבילה מוצגת בדף המוצר. מחיר מדויק — ללא עיגול אוטומטי.</p>
              </div>
              <button type="button" onClick={addBundle} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">+ הוסף חבילה</button>
            </div>

            {bundles.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">
                <p className="text-2xl mb-2">📦</p>
                <p>אין חבילות — הדף ישתמש בברירות מחדל (×1, ×3, ×4)</p>
                <p className="text-xs mt-1 text-gray-700">לשליטה מלאה במחירים ובתצוגה — צור חבילות כאן</p>
              </div>
            )}

            {bundles.map((b, i) => (
              <div key={i} className="bg-[#080C16] rounded-2xl border border-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">חבילה {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                      <div className={`relative w-8 h-4 rounded-full transition-colors ${b.active ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => setBundle(i, 'active', !b.active)}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${b.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      פעיל
                    </label>
                    <button type="button" onClick={() => setBundles(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>שם החבילה</label>
                    <input className={inputCls} value={b.title} onChange={e => setBundle(i, 'title', e.target.value)} placeholder="2 כרטיסים + 1 חינם" />
                  </div>
                  <div>
                    <label className={labelCls}>כמות כרטיסים</label>
                    <input className={inputCls} type="number" min="1" value={b.quantity} onChange={e => setBundle(i, 'quantity', Number(e.target.value))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>מחיר מכירה (₪)</label>
                    <input className={inputCls} type="number" step="0.01" value={b.priceNIS} onChange={e => setBundle(i, 'priceNIS', e.target.value)} placeholder="299.90" />
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="text-xs text-gray-600">פרסט:</span>
                      {(['x90', 'x99', 'round'] as const).map(m => (
                        <button key={m} type="button" onClick={() => applyPricingPreset(i, m)}
                          className={`${presetBtnCls} bg-white/5 hover:bg-white/10 text-gray-400`}>
                          {m === 'x90' ? '.90' : m === 'x99' ? '.99' : 'עגול'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>מחיר מחוק (₪)</label>
                    <input className={inputCls} type="number" step="0.01" value={b.compareAtPriceNIS} onChange={e => setBundle(i, 'compareAtPriceNIS', e.target.value)} placeholder="399.90" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>תווית (badge)</label>
                    <input className={inputCls} value={b.badge} onChange={e => setBundle(i, 'badge', e.target.value)} placeholder="72% מהלקוחות" />
                  </div>
                  <div>
                    <label className={labelCls}>צבע תווית</label>
                    <select className={inputCls} value={b.badgeColor} onChange={e => setBundle(i, 'badgeColor', e.target.value)}>
                      <option value="bg-blue-600">כחול</option>
                      <option value="bg-orange-500">כתום</option>
                      <option value="bg-green-600">ירוק</option>
                      <option value="bg-red-600">אדום</option>
                      <option value="bg-purple-600">סגול</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>יתרונות (שורה לכל יתרון)</label>
                  <textarea className={`${inputCls} resize-none`} rows={2} value={b.benefits} onChange={e => setBundle(i, 'benefits', e.target.value)} placeholder="חסכון 40%&#10;חינם אחד" />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-9 h-5 rounded-full transition-colors ${b.isRecommended ? 'bg-emerald-600' : 'bg-gray-700'}`} onClick={() => setBundle(i, 'isRecommended', !b.isRecommended)}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${b.isRecommended ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-300">מסומן כמומלץ (בחירה ברירת מחדל)</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pricing ── */}
      {tab === 'pricing' && (
        <div className="space-y-4">
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">מחיר בסיס</h3>
            <p className="text-xs text-gray-500 -mt-2">מחיר הבסיס משמש כברירת מחדל כאשר אין חבילות מוגדרות</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>מחיר מכירה (₪) *</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.sellingPriceNIS} onChange={e => set('sellingPriceNIS', e.target.value)} required placeholder="199.90" />
                <div className="flex gap-1.5 mt-1.5">
                  <span className="text-xs text-gray-600">פרסט:</span>
                  {(['x90', 'x99', 'round'] as const).map(m => (
                    <button key={m} type="button" onClick={() => applyBasePreset(m)} className={`${presetBtnCls} bg-white/5 hover:bg-white/10 text-gray-400`}>
                      {m === 'x90' ? '.90' : m === 'x99' ? '.99' : 'עגול'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>מחיר מחוק (₪)</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.compareAtPriceNIS} onChange={e => set('compareAtPriceNIS', e.target.value)} placeholder="298.90" />
                <div className="flex gap-1.5 mt-1.5">
                  <span className="text-xs text-gray-600">פרסט:</span>
                  {(['x90', 'x99', 'round'] as const).map(m => (
                    <button key={m} type="button" onClick={() => applyComparePreset(m)} className={`${presetBtnCls} bg-white/5 hover:bg-white/10 text-gray-400`}>
                      {m === 'x90' ? '.90' : m === 'x99' ? '.99' : 'עגול'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>עלות (₪)</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.costPriceNIS} onChange={e => set('costPriceNIS', e.target.value)} placeholder="30.00" />
              </div>
            </div>
            {form.sellingPriceNIS && form.costPriceNIS && Number(form.costPriceNIS) > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                רווח: ₪{(Number(form.sellingPriceNIS) - Number(form.costPriceNIS)).toFixed(2)} · {Math.round(((Number(form.sellingPriceNIS) - Number(form.costPriceNIS)) / Number(form.sellingPriceNIS)) * 100)}% מרווח
              </div>
            )}
          </div>

          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">מלאי</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.trackQuantity ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => set('trackQuantity', !form.trackQuantity)}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.trackQuantity ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">מעקב כמות במלאי</span>
            </label>
            {form.trackQuantity && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>כמות במלאי</label>
                  <input className={inputCls} type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>סף התראת מלאי נמוך</label>
                  <input className={inputCls} type="number" min="0" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {tab === 'content' && (
        <div className="space-y-4">

          {/* Urgency + Shipping + Guarantee */}
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">טקסטים שיווקיים</h3>
            <div>
              <label className={labelCls}>טקסט דחיפות (urgency bar 🔥)</label>
              <input className={inputCls} value={form.urgencyText} onChange={e => set('urgencyText', e.target.value)} placeholder="מבצע מוגבל: 24 שעות אחרונות למחיר הזה!" />
            </div>
            <div>
              <label className={labelCls}>טקסט משלוח</label>
              <input className={inputCls} value={form.shippingText} onChange={e => set('shippingText', e.target.value)} placeholder="מגיע תוך 7–14 ימי עסקים · מספר מעקב במייל" />
            </div>
            <div>
              <label className={labelCls}>טקסט אחריות / ביטחון בקנייה</label>
              <input className={inputCls} value={form.guaranteeText} onChange={e => set('guaranteeText', e.target.value)} placeholder="אחריות לכל החיים + 100 יום החזר כסף מלא — בלי שאלות" />
            </div>
          </div>

          {/* Review stats */}
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-white">סטטיסטיקות ביקורות</h3>
            <p className="text-xs text-gray-500 -mt-2">אם 0 — יוחשב אוטומטית מביקורות מאושרות ב-DB</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>ציון ממוצע (0–5)</label>
                <input className={inputCls} type="number" min="0" max="5" step="0.1" value={form.reviewRating || ''} onChange={e => set('reviewRating', e.target.value)} placeholder="4.9" />
              </div>
              <div>
                <label className={labelCls}>מספר ביקורות</label>
                <input className={inputCls} type="number" min="0" value={form.reviewCount || ''} onChange={e => set('reviewCount', e.target.value)} placeholder="312" />
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">אייקוני אמון</h3>
                <p className="text-xs text-gray-500">מוצגים מתחת לתמונה ובסטריפ הנייד</p>
              </div>
              <button type="button" onClick={addBadge} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">+ הוסף</button>
            </div>
            {trustBadges.length === 0 && <p className="text-xs text-gray-600 py-2">ריק — יופיעו ברירות מחדל (אחריות / משלוח / תשלום)</p>}
            {trustBadges.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={`${inputCls} w-16`} value={b.icon} onChange={e => setBadge(i, 'icon', e.target.value)} placeholder="🛡️" />
                <input className={`${inputCls} flex-1`} value={b.text} onChange={e => setBadge(i, 'text', e.target.value)} placeholder="אחריות לכל החיים" />
                <button type="button" onClick={() => setTrustBadges(prev => prev.filter((_, j) => j !== i))} className="text-red-400 text-sm px-2">✕</button>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">מאפיינים (Features)</h3>
                <p className="text-xs text-gray-500">גריד 6 אייקונים — "למה FindCard?"</p>
              </div>
              <button type="button" onClick={addFeature} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">+ הוסף</button>
            </div>
            {features.length === 0 && <p className="text-xs text-gray-600 py-2">ריק — יופיעו ברירות מחדל (Bluetooth, עובי, סוללה, מים, התראה, הגדרה)</p>}
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={`${inputCls} w-16`} value={f.icon} onChange={e => setFeature(i, 'icon', e.target.value)} placeholder="📡" />
                <input className={`${inputCls} flex-1`} value={f.label} onChange={e => setFeature(i, 'label', e.target.value)} placeholder="כותרת" />
                <input className={`${inputCls} flex-1`} value={f.desc} onChange={e => setFeature(i, 'desc', e.target.value)} placeholder="תיאור" />
                <button type="button" onClick={() => setFeatures(prev => prev.filter((_, j) => j !== i))} className="text-red-400 text-sm px-2">✕</button>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">שאלות נפוצות (FAQ)</h3>
              </div>
              <button type="button" onClick={addFaq} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">+ הוסף שאלה</button>
            </div>
            {faqs.length === 0 && <p className="text-xs text-gray-600 py-2">ריק — יופיעו ברירות מחדל (6 שאלות)</p>}
            {faqs.map((f, i) => (
              <div key={i} className="bg-[#080C16] rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input className={`${inputCls} flex-1`} value={f.q} onChange={e => setFaq(i, 'q', e.target.value)} placeholder="שאלה" />
                  <button type="button" onClick={() => setFaqs(prev => prev.filter((_, j) => j !== i))} className="text-red-400 text-sm px-2">✕</button>
                </div>
                <textarea className={`${inputCls} resize-none`} rows={2} value={f.a} onChange={e => setFaq(i, 'a', e.target.value)} placeholder="תשובה" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SEO ── */}
      {tab === 'seo' && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white">הגדרות SEO</h3>
          <div>
            <label className={labelCls}>כותרת META (עד 60 תווים)</label>
            <input className={inputCls} value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} placeholder={`${form.nameHe} — FindCard`} maxLength={60} />
            <p className="text-xs text-gray-600 mt-1">{form.metaTitle.length}/60</p>
          </div>
          <div>
            <label className={labelCls}>תיאור META (עד 160 תווים)</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} placeholder="תיאור קצר..." maxLength={160} />
            <p className="text-xs text-gray-600 mt-1">{form.metaDescription.length}/160</p>
          </div>
        </div>
      )}

      {/* ── Shipping ── */}
      {tab === 'shipping' && (
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-white">הגדרות משלוח</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative w-10 h-5 rounded-full transition-colors ${form.requiresShipping ? 'bg-blue-600' : 'bg-gray-700'}`} onClick={() => set('requiresShipping', !form.requiresShipping)}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.requiresShipping ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-300">מוצר פיזי — דורש משלוח</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative w-10 h-5 rounded-full transition-colors ${form.freeShipping ? 'bg-emerald-600' : 'bg-gray-700'}`} onClick={() => set('freeShipping', !form.freeShipping)}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.freeShipping ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-300">משלוח חינם</span>
          </label>
          <div>
            <label className={labelCls}>משקל (גרם)</label>
            <input className={inputCls} type="number" min="0" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="7" />
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/5">
        <button type="submit" disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
          {saving ? <><span className="animate-spin text-base">⏳</span> שומר...</> : '✓ שמור מוצר'}
        </button>
        <button type="button" onClick={() => router.back()} className="bg-white/5 hover:bg-white/10 text-gray-300 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">ביטול</button>
        <span className="mr-auto text-xs text-gray-600">
          {saving ? 'שומר...' : init ? `עודכן ${new Date(init.updatedAt as string).toLocaleDateString('he-IL')}` : 'טרם נשמר'}
        </span>
      </div>
    </form>
  )
}
