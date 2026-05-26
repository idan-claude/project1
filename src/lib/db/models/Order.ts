import mongoose, { Schema, Document, Model } from 'mongoose'

interface IOrderItem {
  productId: mongoose.Types.ObjectId
  slug: string
  nameHe: string
  image: string
  variantLabel: string
  quantity: number
  unitPrice: number  // agorot
  totalPrice: number // agorot
}

interface IOrderPricing {
  subtotal: number    // agorot
  shippingCost: number
  discount: number
  total: number
}

interface IPayment {
  method: 'cardcom' | 'tranzila' | 'manual'
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  transactionId: string
  paidAt?: Date
  gatewayResponse?: Record<string, unknown>
}

export interface IOrder extends Document {
  storeId: string
  orderNumber: string
  customer: {
    userId: mongoose.Types.ObjectId | null
    name: string
    email: string
    phone: string
  }
  shippingAddress: {
    street: string
    city: string
    zip: string
    country: string
  }
  items: IOrderItem[]
  pricing: IOrderPricing
  payment: IPayment
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  notes: string
  trackingNumber: string
  notifications: {
    whatsappSent: boolean
    emailSent: boolean
  }
  testMode: boolean
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    storeId: { type: String, default: 'default', index: true },
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
    },
    shippingAddress: {
      street: String,
      city: String,
      zip: String,
      country: { type: String, default: 'IL' },
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        slug: String,
        nameHe: String,
        image: String,
        variantLabel: { type: String, default: '' },
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
      },
    ],
    pricing: {
      subtotal: Number,
      shippingCost: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: Number,
    },
    payment: {
      method: { type: String, enum: ['cardcom', 'tranzila', 'manual'], default: 'cardcom' },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      transactionId: { type: String, default: '' },
      paidAt: Date,
      gatewayResponse: { type: Schema.Types.Mixed },
    },
    status: {
      type: String,
      enum: ['new', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'new',
    },
    notes: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    notifications: {
      whatsappSent: { type: Boolean, default: false },
      emailSent: { type: Boolean, default: false },
    },
    testMode: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

OrderSchema.index({ 'customer.email': 1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ 'payment.status': 1 })
OrderSchema.index({ createdAt: -1 })

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
export default Order
