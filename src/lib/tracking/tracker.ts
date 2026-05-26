// Client-side visitor tracking utility
// Call track() on page views, cart events, checkout

const SESSION_KEY = 'fc_sid'
const VISITOR_KEY = 'fc_vid'

function getId(key: string): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage?.getItem(key) || localStorage?.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    if (key === SESSION_KEY) sessionStorage?.setItem(key, id)
    else localStorage?.setItem(key, id)
  }
  return id
}

function getUTM(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  return {
    utm_source:   p.get('utm_source')   || '',
    utm_medium:   p.get('utm_medium')   || '',
    utm_campaign: p.get('utm_campaign') || '',
    utm_content:  p.get('utm_content')  || '',
    utm_term:     p.get('utm_term')     || '',
  }
}

export type TrackEvent =
  | 'pageview' | 'product_view' | 'add_to_cart'
  | 'checkout_start' | 'checkout_complete'
  | 'scroll_depth' | 'rage_click' | 'exit_page' | 'custom'

export async function track(
  event: TrackEvent,
  meta: Record<string, unknown> = {},
  orderId: string | null = null
) {
  if (typeof window === 'undefined') return
  try {
    const sessionId = getId(SESSION_KEY)
    const visitorId = getId(VISITOR_KEY)
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        visitorId,
        event,
        path: window.location.pathname,
        referrer: document.referrer,
        utm: getUTM(),
        language: navigator.language || '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        scroll: meta.scroll ?? 0,
        meta,
        orderId,
      }),
      keepalive: true,
    })
  } catch {
    // tracking failures are silent
  }
}

// Attach scroll depth tracking to a page — fires events at 25/50/75/100%
export function trackScrollDepth() {
  if (typeof window === 'undefined') return
  const milestones = [25, 50, 75, 100]
  const fired = new Set<number>()

  function onScroll() {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) return
    const pct = Math.round((scrollTop / docHeight) * 100)
    for (const m of milestones) {
      if (!fired.has(m) && pct >= m) {
        fired.add(m)
        track('scroll_depth', { scroll: m, path: window.location.pathname })
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}
