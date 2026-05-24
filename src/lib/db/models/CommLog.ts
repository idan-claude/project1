import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICommLog extends Document {
  orderId: mongoose.Types.ObjectId
  orderNumber: string
  customerEmail: string
  customerPhone: string
  channel: 'email' | 'whatsapp' | 'sms'
  eventType: string
  subject: string
  body: string
  status: 'sent' | 'failed' | 'skipped' | 'pending'
  error?: string
  scheduledFor?: Date
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CommLogSchema = new Schema<ICommLog>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    channel: {
      type: String,
      enum: ['email', 'whatsapp', 'sms'],
      required: true,
    },
    eventType: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped', 'pending'],
      default: 'sent',
    },
    error: { type: String },
    scheduledFor: { type: Date },
    sentAt: { type: Date },
  },
  { timestamps: true }
)

CommLogSchema.index({ eventType: 1, orderId: 1 })
CommLogSchema.index({ scheduledFor: 1 })

const CommLog: Model<ICommLog> =
  mongoose.models.CommLog || mongoose.model<ICommLog>('CommLog', CommLogSchema)

export default CommLog
