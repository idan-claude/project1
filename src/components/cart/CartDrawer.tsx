'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Button } from '@/components/ui/Button'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total } = useCartStore()

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}

      {/* Drawer — slides in from left (RTL) */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-lg">סל הקניות</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="font-medium">הסל שלך ריק</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantLabel}`} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image && (
                      <Image src={item.image} alt={item.nameHe} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.nameHe}</p>
                    {item.variantLabel && <p className="text-xs text-gray-500">{item.variantLabel}</p>}
                    <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(item.sellingPrice)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantLabel, item.quantity - 1)}
                        className="w-6 h-6 rounded border text-sm flex items-center justify-center hover:bg-gray-50"
                      >-</button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantLabel, item.quantity + 1)}
                        className="w-6 h-6 rounded border text-sm flex items-center justify-center hover:bg-gray-50"
                      >+</button>
                      <button
                        onClick={() => removeItem(item.productId, item.variantLabel)}
                        className="mr-auto text-red-400 hover:text-red-600 text-xs"
                      >הסר</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t bg-gray-50 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">סה"כ לפני משלוח</span>
                <span className="font-bold">{formatPrice(total())}</span>
              </div>
              {total() < 30000 && (
                <p className="text-xs text-gray-500">
                  הוסף עוד {formatPrice(30000 - total())} לקבלת משלוח חינם
                </p>
              )}
              <Link href="/checkout" onClick={onClose}>
                <Button className="w-full" size="lg">המשך לתשלום</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
