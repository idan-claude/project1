'use client'
import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AdminSidebar from './AdminSidebar'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const contentWrapRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const lastScrollTop = useRef(0)
  const clearTimer = useRef<ReturnType<typeof setTimeout>>()

  // Continuously track scroll position so we know where user was before navigation
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const save = () => { lastScrollTop.current = el.scrollTop }
    el.addEventListener('scroll', save, { passive: true })
    return () => el.removeEventListener('scroll', save)
  }, [])

  // On every navigation: prevent the loading-state height collapse that clamps scroll to 0.
  // The short loading skeleton makes the container shorter than the saved scrollTop,
  // so the browser resets scrollTop to 0 — that's the "jump to top".
  // Fix: temporarily extend the wrapper's min-height so the saved scrollTop stays valid,
  // then restore it. Clear the override once content has likely loaded.
  useLayoutEffect(() => {
    const main = mainRef.current
    const wrap = contentWrapRef.current
    if (!main || !wrap) return

    const saved = lastScrollTop.current
    if (saved > 0) {
      wrap.style.minHeight = `${saved + main.clientHeight}px`
      main.scrollTop = saved
    }

    clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => {
      if (contentWrapRef.current) contentWrapRef.current.style.minHeight = ''
    }, 800)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
      {/* Mobile dark overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slides in from right on mobile, always visible on desktop */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-40 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-auto min-w-0">
        {/* Mobile top bar — sticky within <main> scroll container */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0F172A] sticky top-0 z-20 shadow">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            FC
          </div>
          <span className="font-bold text-white flex-1 text-sm">FindCard Admin</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="פתח תפריט"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Content wrapper — gets temporary min-height during page transitions */}
        <div ref={contentWrapRef}>
          {children}
        </div>
      </main>
    </div>
  )
}
