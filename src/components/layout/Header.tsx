'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/cart/CartDrawer'

export default function Header() {
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">
              TrackIt IL
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 font-medium">
              <Link href="/products" className="hover:text-blue-600 transition-colors">כל המוצרים</Link>
              <Link href="/products?featured=true" className="hover:text-blue-600 transition-colors">מוצרים מובחרים</Link>
              <Link href="/products?category=bundles" className="hover:text-blue-600 transition-colors">חבילות</Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/account" className="hidden md:block text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
                החשבון שלי
              </Link>
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CartIcon />
                סל קניות
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3 text-sm font-medium text-gray-700">
            <Link href="/products" onClick={() => setMenuOpen(false)}>כל המוצרים</Link>
            <Link href="/products?featured=true" onClick={() => setMenuOpen(false)}>מוצרים מובחרים</Link>
            <Link href="/products?category=bundles" onClick={() => setMenuOpen(false)}>חבילות</Link>
            <Link href="/account" onClick={() => setMenuOpen(false)}>החשבון שלי</Link>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

function CartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
