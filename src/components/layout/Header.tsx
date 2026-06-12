'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import CartDrawer from '@/components/cart/CartDrawer'
import type { IHeaderConfig } from '@/lib/db/models/StoreTheme'

const SECTIONS = [
  { id: 'hero',     label: 'ראשי' },
  { id: 'features', label: 'יתרונות' },
  { id: 'product',  label: 'המוצר' },
  { id: 'reviews',  label: 'ביקורות' },
  { id: 'faq',      label: 'שאלות' },
]

interface HeaderProps {
  headerConfig?: IHeaderConfig
  logoUrl?: string
  storeName?: string
}

export default function Header({
  headerConfig,
  logoUrl = '',
  storeName = 'FindCard',
}: HeaderProps) {
  const config = headerConfig ?? {
    announcementEnabled: true,
    announcementText: '🚚 משלוח חינם על כל הזמנה',
    announcementBg: '#1d4ed8',
    stickyHeader: true,
    ctaText: 'הזמן עכשיו',
    ctaEnabled: true,
    phone: '',
    whatsapp: '',
  }

  const pathname  = usePathname()
  const isHome    = pathname === '/'
  const [cartOpen, setCartOpen]           = useState(false)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const itemCount = useCartStore((s) => s.itemCount())

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
        { rootMargin: '-104px 0px -75% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [isHome])

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
      setTimeout(() => scrollToId(id), 50)
    } else {
      sessionStorage.setItem('fc_scroll_to', id)
      window.location.href = '/'
    }
  }

  return (
    <>
      <div className={config.stickyHeader ? 'sticky top-0 z-40' : 'relative z-40'} data-header>
        {/* Announcement bar */}
        {config.announcementEnabled && (
          <div
            className="text-white text-center text-xs font-bold py-2.5 px-4"
            style={{ backgroundColor: config.announcementBg || '#1d4ed8' }}
          >
            <span>{config.announcementText}</span>
          </div>
        )}

        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <button
                onClick={() => isHome ? scrollToId('hero') : (window.location.href = '/')}
                className="flex items-center focus-visible:outline-none"
                aria-label={`${storeName} — scroll to top`}
              >
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={storeName}
                    width={120}
                    height={40}
                    className="h-9 w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-xl font-black tracking-tight text-gray-900">{storeName}</span>
                )}
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
                {config.phone && (
                  <a
                    href={`tel:${config.phone.replace(/\s/g, '')}`}
                    className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    aria-label={`חייג ל-${config.phone}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{config.phone}</span>
                  </a>
                )}
                {config.whatsapp && (
                  <a
                    href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] transition-colors"
                    aria-label="WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                )}
                {config.ctaEnabled && (
                  <button
                    onClick={() => setCartOpen(true)}
                    className="relative flex items-center gap-1.5 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {config.ctaText || 'הזמן עכשיו'}
                    {itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {itemCount}
                      </span>
                    )}
                  </button>
                )}
                <button className="md:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 flex items-center justify-center" onClick={() => setMenuOpen(!menuOpen)} aria-label="תפריט">
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
              {(config.phone || config.whatsapp) && (
                <div className="flex gap-2 px-3 pt-2 mt-1 border-t border-gray-100">
                  {config.phone && (
                    <a href={`tel:${config.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors text-xs py-1">
                      📞 {config.phone}
                    </a>
                  )}
                  {config.whatsapp && (
                    <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#25D366] font-semibold text-xs py-1">
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </header>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
