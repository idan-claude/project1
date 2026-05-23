'use client'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/formatPrice'
import { useCartStore } from '@/store/cartStore'

interface ProductCardProps {
  product: {
    _id: string
    slug: string
    nameHe: string
    images: { url: string; alt: string }[]
    pricing: { sellingPrice: number; compareAtPrice: number }
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const image = product.images[0]?.url
  const hasDiscount = product.pricing.compareAtPrice > product.pricing.sellingPrice

  function handleAdd() {
    addItem({
      productId: product._id,
      slug: product.slug,
      nameHe: product.nameHe,
      image: image || '',
      sellingPrice: product.pricing.sellingPrice,
      quantity: 1,
      variantLabel: '',
    })
  }

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square bg-gray-50">
          {image ? (
            <Image src={image} alt={product.nameHe} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              מבצע
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">{product.nameHe}</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">{formatPrice(product.pricing.sellingPrice)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">{formatPrice(product.pricing.compareAtPrice)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          onClick={handleAdd}
          className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          הוסף לסל
        </button>
      </div>
    </div>
  )
}
