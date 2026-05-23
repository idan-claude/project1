import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  async function handleSave(data: unknown) {
    'use server'
    // This runs on client via ProductForm's fetch call
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">מוצר חדש</h1>
      <NewProductClient />
    </div>
  )
}

function NewProductClient() {
  'use client'
  return null
}
