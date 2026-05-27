import crypto from 'crypto'

export type TikTokEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'PlaceAnOrder'  // TikTok's name for Purchase

export interface TikTokEventPayload {
  pixel_code: string
  event: TikTokEventName
  event_id: string
  timestamp: string
  context: {
    page?: { url: string; referrer?: string }
    ip: string
    user_agent: string
    ad?: { callback?: string }
  }
  properties?: {
    value?: number
    currency?: string
    content_id?: string
    content_name?: string
    content_type?: string
    contents?: Array<{ content_id: string; price: number; quantity: number }>
    num_items?: number
    order_id?: string
  }
  user?: {
    email?: string    // SHA256 hashed
    phone_number?: string
  }
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export function generateTikTokEventId(eventName: TikTokEventName, sessionId: string): string {
  return `tt_${eventName}_${sessionId}_${Date.now()}`
}

export function buildTikTokPurchasePayload(opts: {
  orderId: string
  sessionId: string
  totalAgorot: number
  items: Array<{ id: string; quantity: number; unitPrice: number; name?: string }>
  email?: string
  phone?: string
  ip: string
  userAgent: string
  pageUrl: string
  ttclid?: string
  eventId?: string
}): TikTokEventPayload {
  const pixelCode = process.env.TIKTOK_PIXEL_ID || ''
  const eventId = opts.eventId || generateTikTokEventId('PlaceAnOrder', opts.sessionId)
  return {
    pixel_code: pixelCode,
    event: 'PlaceAnOrder',
    event_id: eventId,
    timestamp: new Date().toISOString(),
    context: {
      page: { url: opts.pageUrl },
      ip: opts.ip,
      user_agent: opts.userAgent,
      ad: opts.ttclid ? { callback: opts.ttclid } : undefined,
    },
    properties: {
      value: opts.totalAgorot / 100,
      currency: 'ILS',
      content_id: opts.items[0]?.id,
      content_type: 'product',
      contents: opts.items.map(i => ({ content_id: i.id, price: i.unitPrice / 100, quantity: i.quantity })),
      num_items: opts.items.reduce((s, i) => s + i.quantity, 0),
      order_id: opts.orderId,
    },
    user: {
      email: opts.email ? sha256(opts.email) : undefined,
      phone_number: opts.phone ? sha256(opts.phone.replace(/[\s\-\(\)\+]/g, '')) : undefined,
    },
  }
}
