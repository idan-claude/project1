// Client-side visitor tracking utility

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
  | 'scroll_depth' | 'rage_click' | 'exit_page'
  | 'faq_open' | 'gallery_view' | 'cta_click' | 'inactive'
  | 'custom'

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

// Attach scroll depth tracking — fires at 25/50/75/100%
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

// Rage click detection — 3+ clicks on same element within 800ms
export function trackRageClicks(container: HTMLElement | null = null) {
  if (typeof window === 'undefined') return
  const target = container || document.body
  const clicks: { time: number; x: number; y: number }[] = []
  const WINDOW_MS = 800
  const THRESHOLD = 3

  function onClick(e: MouseEvent) {
    const now = Date.now()
    clicks.push({ time: now, x: e.clientX, y: e.clientY })
    // keep only recent clicks
    const recent = clicks.filter(c => now - c.time < WINDOW_MS)
    clicks.length = 0
    clicks.push(...recent)

    if (recent.length >= THRESHOLD) {
      // check proximity (within 40px)
      const xs = recent.map(c => c.x)
      const ys = recent.map(c => c.y)
      const rangeX = Math.max(...xs) - Math.min(...xs)
      const rangeY = Math.max(...ys) - Math.min(...ys)
      if (rangeX < 40 && rangeY < 40) {
        track('rage_click', {
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
          count: recent.length,
          path: window.location.pathname,
          target: (e.target as HTMLElement)?.tagName || '',
        })
        clicks.length = 0 // reset after reporting
      }
    }
  }

  target.addEventListener('click', onClick)
  return () => target.removeEventListener('click', onClick)
}

// Inactivity detection — fires once after `ms` of no user interaction
export function trackInactivity(ms = 30000) {
  if (typeof window === 'undefined') return
  let timer: ReturnType<typeof setTimeout>
  let fired = false

  function reset() {
    clearTimeout(timer)
    if (!fired) {
      timer = setTimeout(() => {
        fired = true
        track('inactive', { duration: Math.round(ms / 1000), path: window.location.pathname })
      }, ms)
    }
  }

  const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click']
  events.forEach(e => window.addEventListener(e, reset, { passive: true }))
  reset() // start timer

  return () => {
    clearTimeout(timer)
    events.forEach(e => window.removeEventListener(e, reset))
  }
}
