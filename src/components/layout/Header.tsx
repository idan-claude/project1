'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/cart/CartDrawer'

const SECTIONS = [
  { id: 'hero',     label: 'ראשי' },
  { id: 'features', label: 'יתרונות' },
  { id: 'product',  label: 'המוצר' },
  { id: 'reviews',  label: 'ביקורות' },
  { id: 'faq',      label: 'שאלות' },
]

export default function Header() {
  const pathname  = usePathname()
  const isHome    = pathname === '/'
  const [cartOpen, setCartOpen]           = useState(false)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const itemCount = useCartStore((s) => s.itemCount())

  // Scroll spy — IntersectionObserver, one per section, only on homepage
  useEffect(() => {
    if (!isHome) return
    const observers: IntersectionObserver[] = []

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActiveSection(id)
          })
        },
        {
          rootMargin: '-104px 0px -75% 0px',
          threshold: 0,
        }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [isHome])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  function scrollToId(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const headerEl = document.querySelector<HTMLElement>('[data-header]')
    const top = el.getBoundingClientRect().top + window.scrollY - (headerEl?.offsetHeight ?? 104)
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  function handleSectionClick(id: string) {
    if (isHome) {
      setMenuOpen(false)
      // setTimeout lets React flush the menu-close re-render before measuring header height
      setTimeout(() => scrollToId(id), 50)
    } else {
      sessionStorage.setItem('fc_scroll_to', id)
      window.location.href = '/'
    }
  }

  return (
    <>
      <div className="sticky top-0 z-40" data-header>
        {/* Announcement bar */}
        <div className="bg-blue-700 text-white text-center text-xs font-bold py-2.5 px-4">
          <span className="hidden sm:inline">⚡ מבצע מוגבל: קנה 2 כרטיסים וקבל 1 חינם! &nbsp;·&nbsp; 🚚 משלוח חינם על כל הזמנה &nbsp;·&nbsp; נגמר בקרוב — אל תפספס!</span>
          <span className="sm:hidden">⚡ קנה 2, קבל 1 חינם · משלוח חינם</span>
        </div>

        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <button
                onClick={() => isHome ? scrollToId('hero') : (window.location.href = '/')}
                className="text-xl font-black tracking-tight focus-visible:outline-none"
                aria-label="FindCard — scroll to top"
              >
                <span className="text-blue-600">Find</span><span className="text-gray-900">Card</span>
              </button>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium" aria-label="ניווט ראשי">
                {isHome ? (
                  SECTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => handleSectionClick(id)}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
                        activeSection === id
                          ? 'text-blue-600 bg-blue-50 font-semibold'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))
                ) : (
                  <>
                    <Link href="/" className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors">בית</Link>
                    <Link href="/product" className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors">המוצר שלנו</Link>
                    <Link href="/track" className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors">מעקב הזמנה</Link>
                  </>
                )}
              </nav>

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
                <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)} aria-label="תפריט">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-1 text-sm font-medium">
              {isHome ? (
                SECTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => handleSectionClick(id)}
                    className={`text-right w-full px-3 py-2.5 rounded-lg transition-colors ${
                      activeSection === id
                        ? 'text-blue-600 bg-blue-50 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))
              ) : (
                <>
                  <Link href="/" className="px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>בית</Link>
                  <Link href="/product" className="px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>המוצר שלנו</Link>
                  <Link href="/track" className="px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>מעקב הזמנה</Link>
                </>
              )}
            </div>
          )}
        </header>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
