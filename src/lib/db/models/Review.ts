import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId | null
  productName: string
  customer: { name: string; email: string }
  rating: number
  text: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, default: '' },
    customer: {
      name: { type: String, required: true },
      email: { type: String, default: '' },
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
)

ReviewSchema.index({ status: 1, createdAt: -1 })

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
export default Review
