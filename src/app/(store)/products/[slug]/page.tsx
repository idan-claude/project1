'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/formatPrice'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/Button'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<any>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [mainImage, setMainImage] = useState(0)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product))
  }, [slug])

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const variantLabel = Object.values(selectedVariants).join(' - ')

  function handleAddToCart() {
    addItem({
      productId: product._id,
      slug: product.slug,
      nameHe: product.nameHe,
      image: product.images[0]?.url || '',
      sellingPrice: product.pricing.sellingPrice,
      quantity: 1,
      variantLabel,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
            {product.images[mainImage]?.url ? (
              <Image src={product.images[mainImage].url} alt={product.nameHe} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img: { url: string }, i: number) => (
                <button
                  key={i}
                  onClick={() => setMainImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === mainImage ? 'border-blue-600' : 'border-gray-200'}`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-gray-900">{product.nameHe}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-blue-600">{formatPrice(product.pricing.sellingPrice)}</span>
            {product.pricing.compareAtPrice > product.pricing.sellingPrice && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.pricing.compareAtPrice)}</span>
            )}
          </div>

          {/* Variants */}
          {product.variants?.map((variant: { name: string; options: { label: string }[] }) => (
            <div key={variant.name}>
              <p className="text-sm font-semibold text-gray-700 mb-2">{variant.name}</p>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setSelectedVariants((p) => ({ ...p, [variant.name]: opt.label }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedVariants[variant.name] === opt.label ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Button onClick={handleAddToCart} size="lg" className="w-full">
            {added ? '✓ נוסף לסל!' : 'הוסף לסל'}
          </Button>

          <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
            <p className="flex gap-2"><span>✅</span> 100 יום אחריות להחזרת כסף</p>
            <p className="flex gap-2"><span>🚚</span> משלוח חינם מעל ₪300</p>
            <p className="flex gap-2"><span>🔒</span> תשלום מאובטח</p>
          </div>

          {product.descriptionHe && (
            <div className="prose prose-sm max-w-none text-gray-700 border-t pt-5">
              <h3 className="font-semibold text-gray-900 mb-2">תיאור המוצר</h3>
              <p className="leading-relaxed">{product.descriptionHe}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
