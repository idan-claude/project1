import mongoose, { Schema, Document } from 'mongoose'

export interface IAuditLog extends Document {
  storeId: string
  type: 'login_success' | 'login_fail' | 'order_update' | 'product_create' | 'product_update' | 'product_delete' | 'coupon_create' | 'settings_update' | 'review_update' | 'admin_action'
  actor: string
  entity: string
  entityId: string
  description: string
  ip: string
  userAgent: string
  meta: Record<string, unknown>
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  storeId:     { type: String, default: 'default', index: true },
  type:        { type: String, required: true, index: true },
  actor:       { type: String, default: 'admin' },
  entity:      { type: String, default: '' },
  entityId:    { type: String, default: '' },
  description: { type: String, required: true },
  ip:          { type: String, default: '' },
  userAgent:   { type: String, default: '' },
  meta:        { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } })

AuditLogSchema.index({ createdAt: -1 })
AuditLogSchema.index({ type: 1, createdAt: -1 })

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
