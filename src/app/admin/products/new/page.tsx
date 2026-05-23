'use client'
import { useRouter } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  const router = useRouter()

  async function handleSave(data: unknown) {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'שגיאה בשמירת המוצר')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">מוצר חדש</h1>
      <ProductForm onSave={handleSave} />
    </div>
  )
}
