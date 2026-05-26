'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductForm from '@/components/admin/ProductForm'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then(r => r.json())
      .then(d => setProduct(d.product || null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const d = await res.json()
      alert(d.error || 'שגיאה בשמירת המוצר')
      throw new Error(d.error)
    }
    router.push('/admin/products')
  }

  if (loading) return (
    <div className="p-6 min-h-screen bg-[#080C16]">
      <div className="max-w-2xl space-y-3 animate-pulse">
        {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-[#0E1525] rounded-2xl" />)}
      </div>
    </div>
  )

  if (!product) return (
    <div className="p-6 min-h-screen bg-[#080C16] flex flex-col items-center justify-center text-center">
      <p className="text-4xl mb-3">❌</p>
      <p className="text-white font-semibold mb-1">מוצר לא נמצא</p>
      <Link href="/admin/products" className="text-blue-400 text-sm hover:underline">← חזור למוצרים</Link>
    </div>
  )

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← מוצרים
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-lg font-bold text-white truncate max-w-xs">{product.nameHe as string}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/products/${id}/layout`}
            className="text-xs text-purple-400 hover:text-purple-300 border border-purple-400/30 px-3 py-1.5 rounded-lg transition-colors">
            🧩 עורך עמוד
          </Link>
          <a href="/product" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-400/30 px-3 py-1.5 rounded-lg transition-colors">
            תצוגה מקדימה ↗
          </a>
        </div>
      </div>
      <div className="max-w-2xl">
        <ProductForm initial={product} onSave={handleSave} />
      </div>
    </div>
  )
}
