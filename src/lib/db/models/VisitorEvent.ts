import mongoose, { Schema, Document } from 'mongoose'

export interface IVisitorEvent extends Document {
  storeId: string
  sessionId: string
  visitorId: string        // stable across sessions via cookie
  event: 'pageview' | 'add_to_cart' | 'checkout_start' | 'checkout_complete' | 'product_view' | 'custom'
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
  }
  meta: Record<string, unknown>  // custom event data (e.g. product added, tier selected)
  orderId: string | null
  createdAt: Date
}

const VisitorEventSchema = new Schema<IVisitorEvent>({
    storeId: { type: String, default: 'default', index: true },
  sessionId:  { type: String, required: true, index: true },
  visitorId:  { type: String, required: true, index: true },
  event:      { type: String, required: true, index: true },
  path:       { type: String, default: '' },
  referrer:   { type: String, default: '' },
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
  },
  meta:    { type: Schema.Types.Mixed, default: {} },
  orderId: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } })

VisitorEventSchema.index({ createdAt: -1 })
VisitorEventSchema.index({ event: 1, createdAt: -1 })

export default mongoose.models.VisitorEvent || mongoose.model<IVisitorEvent>('VisitorEvent', VisitorEventSchema)
