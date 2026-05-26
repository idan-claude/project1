import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IIpBlock extends Document {
  storeId: string
  ip: string
  ipMasked: string
  type: 'block' | 'whitelist'
  reason: string
  expiresAt: Date | null
  createdBy: string
  createdAt: Date
}

const IpBlockSchema = new Schema<IIpBlock>(
  {
    storeId:   { type: String, default: 'default', index: true },
    ip:        { type: String, required: true },
    ipMasked:  { type: String, default: '' },
    type:      { type: String, enum: ['block', 'whitelist'], default: 'block' },
    reason:    { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    createdBy: { type: String, default: 'admin' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

IpBlockSchema.index({ storeId: 1, ip: 1 }, { unique: true })
IpBlockSchema.index({ type: 1 })

function maskIp(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`
  return ip.replace(/:[0-9a-f]+:[0-9a-f]+$/, ':xxxx:xxxx')
}

IpBlockSchema.pre('save', function () {
  this.ipMasked = maskIp(this.ip)
})

const IpBlock: Model<IIpBlock> =
  mongoose.models.IpBlock || mongoose.model<IIpBlock>('IpBlock', IpBlockSchema)
export default IpBlock

export function maskIpDisplay(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`
  return ip.replace(/:[0-9a-f]+:[0-9a-f]+$/, ':xxxx:xxxx')
}
