import ProductGrid from '@/components/product/ProductGrid'
import Link from 'next/link'

interface SearchParams {
  page?: string
  search?: string
  category?: string
  featured?: string
}

async function getProducts(params: SearchParams) {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', params.page)
    if (params.search) qs.set('search', params.search)
    if (params.category) qs.set('category', params.category)
    if (params.featured) qs.set('featured', params.featured)
    qs.set('limit', '16')

    const res = await fetch(`${base}/api/products?${qs}`, { next: { revalidate: 30 } })
    if (!res.ok) return { products: [], total: 0, pages: 1 }
    return res.json()
  } catch {
    return { products: [], total: 0, pages: 1 }
  }
}

async function getCategories() {
  try {
    const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/categories`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.categories || []
  } catch {
    return []
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ products, total, pages }, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
  ])

  const currentPage = parseInt(searchParams.page || '1')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-52 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 mb-4">קטגוריות</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/products"
                className={`block px-3 py-2 rounded-lg hover:bg-gray-100 ${!searchParams.category ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
              >
                כל המוצרים ({total})
              </Link>
            </li>
            {categories.map((cat: { _id: string; nameHe: string; slug: string }) => (
              <li key={cat._id}>
                <Link
                  href={`/products?category=${cat._id}`}
                  className={`block px-3 py-2 rounded-lg hover:bg-gray-100 ${searchParams.category === cat._id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  {cat.nameHe}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {searchParams.search ? `תוצאות עבור "${searchParams.search}"` : 'כל המוצרים'}
            </h1>
            <p className="text-sm text-gray-500">{total} מוצרים</p>
          </div>

          <ProductGrid products={products} />

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/products?page=${p}${searchParams.category ? `&category=${searchParams.category}` : ''}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium border ${p === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
