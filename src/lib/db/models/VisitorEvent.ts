import mongoose, { Schema, Document } from 'mongoose'

export interface IVisitorEvent extends Document {
  storeId: string
  sessionId: string
  visitorId: string
  event: 'pageview' | 'add_to_cart' | 'checkout_start' | 'checkout_complete' | 'product_view' | 'scroll_depth' | 'rage_click' | 'exit_page' | 'faq_open' | 'gallery_view' | 'cta_click' | 'inactive' | 'custom'
  path: string
  referrer: string
  utm: {
    source: string
    medium: string
    campaign: string
    content: string
    term: string
  }
  device: {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown'
    browser: string
    os: string
    userAgent: string
  }
  geo: {
    ip: string
    country: string
    city: string
    isp: string
  }
  language: string
  timezone: string
  scroll: number  // scroll depth percentage (0-100), set on scroll_depth events
  meta: Record<string, unknown>
  orderId: string | null
  createdAt: Date
}

const VisitorEventSchema = new Schema<IVisitorEvent>({
  storeId:   { type: String, default: 'default', index: true },
  sessionId: { type: String, required: true, index: true },
  visitorId: { type: String, required: true, index: true },
  event:     { type: String, required: true, index: true },
  path:      { type: String, default: '' },
  referrer:  { type: String, default: '' },
  utm: {
    source:   { type: String, default: '' },
    medium:   { type: String, default: '' },
    campaign: { type: String, default: '' },
    content:  { type: String, default: '' },
    term:     { type: String, default: '' },
  },
  device: {
    type:      { type: String, default: 'unknown' },
    browser:   { type: String, default: '' },
    os:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  geo: {
    ip:      { type: String, default: '' },
    country: { type: String, default: '' },
    city:    { type: String, default: '' },
    isp:     { type: String, default: '' },
  },
  language: { type: String, default: '' },
  timezone: { type: String, default: '' },
  scroll:   { type: Number, default: 0 },
  meta:     { type: Schema.Types.Mixed, default: {} },
  orderId:  { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } })

VisitorEventSchema.index({ createdAt: -1 })
VisitorEventSchema.index({ event: 1, createdAt: -1 })

export default mongoose.models.VisitorEvent || mongoose.model<IVisitorEvent>('VisitorEvent', VisitorEventSchema)
