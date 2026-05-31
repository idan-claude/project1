import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStoreSettings {
  currency: string
  language: string
  timezone: string
  contactEmail: string
  contactPhone: string
  address: string
  logoUrl: string
  faviconUrl: string
}

export interface IStore extends Document {
  storeId: string
  ownerId: mongoose.Types.ObjectId
  name: string
  slug: string
  subdomain: string
  customDomain: string
  status: 'active' | 'suspended' | 'pending' | 'setup'
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  settings: IStoreSettings
  createdAt: Date
  updatedAt: Date
}

const StoreSchema = new Schema<IStore>(
  {
    storeId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    subdomain: { type: String, default: '', lowercase: true, trim: true },
    customDomain: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended', 'pending', 'setup'], default: 'setup' },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    settings: {
      currency: { type: String, default: 'ILS' },
      language: { type: String, default: 'he' },
      timezone: { type: String, default: 'Asia/Jerusalem' },
      contactEmail: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      address: { type: String, default: '' },
      logoUrl: { type: String, default: '' },
      faviconUrl: { type: String, default: '' },
    },
  },
  { timestamps: true }
)

StoreSchema.index({ slug: 1 }, { unique: true })
StoreSchema.index({ ownerId: 1 })

const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema)
export default Store
