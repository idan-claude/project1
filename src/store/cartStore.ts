'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantLabel?: string) => void
  updateQuantity: (productId: string, variantLabel: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variantLabel === item.variantLabel
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variantLabel === item.variantLabel
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },

      removeItem: (productId, variantLabel = '') => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantLabel === variantLabel)
          ),
        }))
      },

      updateQuantity: (productId, variantLabel, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantLabel)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantLabel === variantLabel ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'trackit-cart' }
  )
)
