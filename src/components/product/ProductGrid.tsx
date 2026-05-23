import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Parameters<typeof ProductCard>[0]['product'][]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-medium">לא נמצאו מוצרים</p>
        <p className="text-sm mt-1">נסה לשנות את מסנני החיפוש</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}
