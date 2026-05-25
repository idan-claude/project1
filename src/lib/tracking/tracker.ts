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

export async function track(
  event: 'pageview' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'checkout_complete' | 'custom',
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
        meta,
        orderId,
      }),
      keepalive: true,
    })
  } catch {
    // tracking failures are silent
  }
}
