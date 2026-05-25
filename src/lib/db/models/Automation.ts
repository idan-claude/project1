import mongoose, { Schema, Document, Model } from 'mongoose'

export type AutomationType =
  | 'abandoned_cart'
  | 'welcome_flow'
  | 'order_confirm'
  | 'review_request'
  | 'winback'
  | 'reorder_reminder'
  | 'birthday'
  | 'low_stock_alert'
  | 'shipping_update'
  | 'custom'

export type AutomationChannel = 'email' | 'whatsapp' | 'sms' | 'both'

export interface IAutomation extends Document {
  storeId: string
  name: string
  type: AutomationType
  channel: AutomationChannel
  status: 'active' | 'paused'
  triggerConfig: {
    delayMinutes: number
    condition?: string
  }
  emailConfig: {
    subject: string
    body: string
    buttonText: string
    buttonUrl: string
  }
  whatsappConfig: {
    message: string
    templateId?: string
  }
  stats: {
    sent: number
    opened: number
    clicked: number
    converted: number
    revenue: number
  }
  createdAt: Date
  updatedAt: Date
}

const AutomationSchema = new Schema<IAutomation>(
  {
    storeId: { type: String, default: 'default', index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['abandoned_cart', 'welcome_flow', 'order_confirm', 'review_request', 'winback', 'reorder_reminder', 'birthday', 'low_stock_alert', 'shipping_update', 'custom'],
      required: true,
    },
    channel: { type: String, enum: ['email', 'whatsapp', 'sms', 'both'], default: 'email' },
    status: { type: String, enum: ['active', 'paused'], default: 'paused' },
    triggerConfig: {
      delayMinutes: { type: Number, default: 60 },
      condition: { type: String, default: '' },
    },
    emailConfig: {
      subject: { type: String, default: '' },
      body: { type: String, default: '' },
      buttonText: { type: String, default: '' },
      buttonUrl: { type: String, default: '' },
    },
    whatsappConfig: {
      message: { type: String, default: '' },
      templateId: { type: String, default: '' },
    },
    stats: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      converted: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

const Automation: Model<IAutomation> =
  mongoose.models.Automation || mongoose.model<IAutomation>('Automation', AutomationSchema)
export default Automation
