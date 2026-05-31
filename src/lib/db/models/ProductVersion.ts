import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProductVersion extends Document {
  storeId: string
  productId: mongoose.Types.ObjectId
  version: number
  snapshot: Record<string, unknown>
  savedBy: string
  note: string
  createdAt: Date
}

const ProductVersionSchema = new Schema<IProductVersion>(
  {
    storeId: { type: String, default: 'default', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    version: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    savedBy: { type: String, default: 'admin' },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

ProductVersionSchema.index({ productId: 1, version: -1 })

const ProductVersion: Model<IProductVersion> =
  mongoose.models.ProductVersion || mongoose.model<IProductVersion>('ProductVersion', ProductVersionSchema)
export default ProductVersion
