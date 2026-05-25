import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IEmailCampaign extends Document {
  name: string
  subject: string
  bodyHtml: string
  bodyText: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduledAt: Date | null
  sentAt: Date | null
  targetSegment: 'all' | 'paid' | 'unpaid' | 'abandoned' | 'custom'
  targetEmails: string[]
  stats: {
    total: number
    sent: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  createdAt: Date
  updatedAt: Date
}

const EmailCampaignSchema = new Schema<IEmailCampaign>(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, default: '' },
    bodyText: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
      default: 'draft',
    },
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    targetSegment: {
      type: String,
      enum: ['all', 'paid', 'unpaid', 'abandoned', 'custom'],
      default: 'all',
    },
    targetEmails: [String],
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

EmailCampaignSchema.index({ status: 1, scheduledAt: 1 })
EmailCampaignSchema.index({ createdAt: -1 })

const EmailCampaign: Model<IEmailCampaign> =
  mongoose.models.EmailCampaign || mongoose.model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema)
export default EmailCampaign
