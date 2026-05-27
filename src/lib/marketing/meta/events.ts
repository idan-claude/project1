import crypto from 'crypto'

export type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Search'
  | 'Lead'

export interface MetaUserData {
  em?: string       // hashed email
  ph?: string       // hashed phone
  fn?: string       // hashed first name
  ln?: string       // hashed last name
  client_ip_address?: string
  client_user_agent?: string
  fbc?: string      // Facebook click ID cookie (_fbc)
  fbp?: string      // Facebook pixel cookie (_fbp)
}

export interface MetaCustomData {
  value?: number
  currency?: string
  content_ids?: string[]
  content_name?: string
  content_type?: string
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  num_items?: number
}

export interface MetaEventPayload {
  event_name: MetaEventName
  event_time: number
  event_id: string
  action_source: 'website'
  event_source_url?: string
  user_data: MetaUserData
  custom_data?: MetaCustomData
}

export function generateEventId(eventName: MetaEventName, sessionId: string): string {
  const ts = Date.now()
  return `${eventName}_${sessionId}_${ts}`
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export function buildUserData(opts: {
  email?: string
  phone?: string
  ip?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}): MetaUserData {
  const data: MetaUserData = {}
  if (opts.email) data.em = sha256(opts.email)
  if (opts.phone) {
    // Normalize Israeli phone: remove +, spaces, dashes; ensure starts with 972 or 05x
    const normalized = opts.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')
    data.ph = sha256(normalized)
  }
  if (opts.ip) data.client_ip_address = opts.ip
  if (opts.userAgent) data.client_user_agent = opts.userAgent
  if (opts.fbp) data.fbp = opts.fbp
  if (opts.fbc) data.fbc = opts.fbc
  return data
}

export function buildPurchasePayload(opts: {
  orderId: string
  sessionId: string
  totalAgorot: number        // ILS agorot → convert to ILS
  items: Array<{ id: string; quantity: number; unitPrice: number }>
  email?: string
  phone?: string
  ip?: string
  userAgent?: string
  fbp?: string
  fbc?: string
  pageUrl?: string
  eventId?: string
}): MetaEventPayload {
  const eventId = opts.eventId || generateEventId('Purchase', opts.sessionId)
  return {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: opts.pageUrl,
    user_data: buildUserData({
      email: opts.email,
      phone: opts.phone,
      ip: opts.ip,
      userAgent: opts.userAgent,
      fbp: opts.fbp,
      fbc: opts.fbc,
    }),
    custom_data: {
      value: opts.totalAgorot / 100,
      currency: 'ILS',
      content_ids: opts.items.map(i => i.id),
      content_type: 'product',
      contents: opts.items.map(i => ({ id: i.id, quantity: i.quantity, item_price: i.unitPrice / 100 })),
      num_items: opts.items.reduce((s, i) => s + i.quantity, 0),
    },
  }
}
