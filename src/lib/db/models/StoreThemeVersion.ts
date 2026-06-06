import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStoreThemeVersion extends Document {
  storeId: string
  version: number
  publishedAt: Date
  publishedBy: string
  label: string
  snapshot: Record<string, unknown>
  createdAt: Date
}

const StoreThemeVersionSchema = new Schema<IStoreThemeVersion>(
  {
    storeId:     { type: String, required: true, index: true },
    version:     { type: Number, required: true },
    publishedAt: { type: Date, required: true },
    publishedBy: { type: String, default: '' },
    label:       { type: String, default: '' },
    snapshot:    { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

StoreThemeVersionSchema.index({ storeId: 1, version: -1 })

const StoreThemeVersion: Model<IStoreThemeVersion> =
  mongoose.models.StoreThemeVersion || mongoose.model<IStoreThemeVersion>('StoreThemeVersion', StoreThemeVersionSchema)
export default StoreThemeVersion
