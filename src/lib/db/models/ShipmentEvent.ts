import mongoose, { Schema, Document, Model } from 'mongoose'
import { TrackingStatus } from '@/lib/tracking/types'

const TRACKING_STATUS_VALUES: TrackingStatus[] = [
  'pending',
  'in_transit',
  'arrived_destination',
  'customs',
  'pickup_available',
  'out_for_delivery',
  'delivered',
  'delayed',
  'failed_delivery',
  'not_found',
  'returned',
]

export interface IShipmentEventDoc extends Document {
  storeId: string
  orderId: mongoose.Types.ObjectId
  orderNumber: string
  trackingNumber: string
  provider: string
  events: Array<{
    timestamp: Date
    description: string
    location: string
    status: string
    raw?: unknown
  }>
  currentStatus: TrackingStatus
  carrier: string
  estimatedDelivery?: Date
  lastPolled?: Date
  lastWebhook?: Date
  registeredAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TrackingEventSubSchema = new Schema(
  {
    timestamp: { type: Date, required: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    raw: { type: Schema.Types.Mixed },
  },
  { _id: false }
)

const ShipmentEventSchema = new Schema<IShipmentEventDoc>(
  {
    storeId: { type: String, default: 'default', index: true },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: { type: String, default: '' },
    trackingNumber: { type: String, default: '', index: true },
    provider: { type: String, default: '17track' },
    events: { type: [TrackingEventSubSchema], default: [] },
    currentStatus: {
      type: String,
      enum: TRACKING_STATUS_VALUES,
      default: 'pending',
    },
    carrier: { type: String, default: '' },
    estimatedDelivery: { type: Date },
    lastPolled: { type: Date },
    lastWebhook: { type: Date },
    registeredAt: { type: Date },
  },
  { timestamps: true }
)

const ShipmentEvent: Model<IShipmentEventDoc> =
  mongoose.models.ShipmentEvent ||
  mongoose.model<IShipmentEventDoc>('ShipmentEvent', ShipmentEventSchema)

export default ShipmentEvent
