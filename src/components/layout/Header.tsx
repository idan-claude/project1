'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/cart/CartDrawer'

export default function Header() {
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [barDismissed, setBarDismissed] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <>
      {/* Announcement bar */}
      {!barDismissed && (
        <div className="bg-blue-700 text-white text-center text-xs font-bold py-2.5 px-4 relative">
          ⚡ מבצע מוגבל: קנה 2 כרטיסים וקבל 1 חינם! &nbsp;·&nbsp; 🚚 משלוח חינם על כל הזמנה &nbsp;·&nbsp; נגמר בקרוב — אל תפספס!
          <button
            onClick={() => setBarDismissed(true)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-xl font-black tracking-tight">
              <span className="text-blue-600">Find</span><span className="text-gray-900">Card</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600 font-medium">
              <Link href="/" className="hover:text-blue-600 transition-colors">בית</Link>
              <Link href="/product" className="hover:text-blue-600 transition-colors">המוצר שלנו</Link>
              <Link href="/track" className="hover:text-blue-600 transition-colors">מעקב הזמנה</Link>
            </nav>

            {/* Cart button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                סל קניות
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-3 text-sm font-medium text-gray-700">
            <Link href="/" onClick={() => setMenuOpen(false)}>בית</Link>
            <Link href="/product" onClick={() => setMenuOpen(false)}>המוצר שלנו</Link>
            <Link href="/track" onClick={() => setMenuOpen(false)}>מעקב הזמנה</Link>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
