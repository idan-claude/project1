'use client'
// Client-side Meta Pixel helpers — import only in browser components
// All events include event_id for server-side CAPI deduplication

export function getPixelId(): string {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
}

export function trackPageView() {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', 'PageView')
}

export function trackViewContent(opts: {
  contentId: string
  contentName: string
  value?: number
  currency?: string
  eventId?: string
}) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', 'ViewContent', {
    content_ids: [opts.contentId],
    content_name: opts.contentName,
    content_type: 'product',
    value: opts.value,
    currency: opts.currency || 'ILS',
  }, { eventID: opts.eventId })
}

export function trackAddToCart(opts: {
  contentId: string
  contentName: string
  value: number
  currency?: string
  eventId?: string
}) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', 'AddToCart', {
    content_ids: [opts.contentId],
    content_name: opts.contentName,
    content_type: 'product',
    value: opts.value,
    currency: opts.currency || 'ILS',
  }, { eventID: opts.eventId })
}

export function trackInitiateCheckout(opts: {
  value: number
  numItems: number
  contentIds: string[]
  currency?: string
  eventId?: string
}) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', 'InitiateCheckout', {
    content_ids: opts.contentIds,
    content_type: 'product',
    value: opts.value,
    num_items: opts.numItems,
    currency: opts.currency || 'ILS',
  }, { eventID: opts.eventId })
}

// Purchase MUST only be called when payment confirmed — use server-side CAPI, not browser pixel
// This helper exists only for deduplication with CAPI — do NOT call unless order is truly paid
export function trackPurchaseConfirm(opts: {
  orderId: string
  value: number
  contentIds: string[]
  currency?: string
  eventId: string
}) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', 'Purchase', {
    content_ids: opts.contentIds,
    content_type: 'product',
    value: opts.value,
    currency: opts.currency || 'ILS',
    order_id: opts.orderId,
  }, { eventID: opts.eventId })
}

// Grab _fbp and _fbc cookies for CAPI matching
export function getFbCookies(): { fbp: string; fbc: string } {
  if (typeof document === 'undefined') return { fbp: '', fbc: '' }
  const cookies = Object.fromEntries(
    document.cookie.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
  return { fbp: cookies._fbp || '', fbc: cookies._fbc || '' }
}

// TypeScript declaration for fbq global
declare global {
  interface Window {
    fbq: (action: string, event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void
    _fbq?: unknown
  }
}
