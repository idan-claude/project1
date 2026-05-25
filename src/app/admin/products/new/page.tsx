'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  const router = useRouter()

  async function handleSave(data: Record<string, unknown>) {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
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

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← מוצרים
        </Link>
        <span className="text-gray-700">/</span>
        <h1 className="text-lg font-bold text-white">מוצר חדש</h1>
      </div>
      <div className="max-w-2xl">
        <ProductForm onSave={handleSave} />
      </div>
    </div>
  )
}
