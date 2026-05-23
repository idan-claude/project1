'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/admin/products/${id}`).then((r) => r.json()).then((d) => setProduct(d.product))
  }, [id])

  async function handleSave(data: unknown) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('שגיאה בשמירת המוצר')
  }

  if (!product) return <div className="p-8 text-gray-400 animate-pulse">טוען...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">עריכת מוצר: {product.nameHe}</h1>
      <ProductForm initial={product} onSave={handleSave} />
    </div>
  )
}
