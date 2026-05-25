import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICoupon extends Document {
  code: string
  type: 'percent' | 'fixed'
  value: number
  uses: number
  maxUses: number | null
  active: boolean
  expiresAt: Date | null
  minOrder: number | null
  createdAt: Date
  updatedAt: Date
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true },
    uses: { type: Number, default: 0 },
    maxUses: { type: Number, default: null },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    minOrder: { type: Number, default: null },
  },
  { timestamps: true }
)

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema)
export default Coupon
