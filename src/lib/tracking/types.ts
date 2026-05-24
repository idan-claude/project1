export type TrackingStatus =
  | 'pending'
  | 'in_transit'
  | 'arrived_destination'
  | 'customs'
  | 'pickup_available'
  | 'out_for_delivery'
  | 'delivered'
  | 'delayed'
  | 'failed_delivery'
  | 'not_found'
  | 'returned'

export type TrackingEvent = {
  timestamp: Date
  description: string
  location: string
  status: TrackingStatus
  raw?: Record<string, unknown>
}

export type ShipmentInfo = {
  trackingNumber: string
  carrier?: string
  status: TrackingStatus
  estimatedDelivery?: Date
  events: TrackingEvent[]
  lastUpdated: Date
}

export type AutomationEvent = {
  orderId: string
  orderNumber: string
  customerId: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  trackingNumber: string
  status: TrackingStatus
  latestEvent: TrackingEvent
  allEvents: TrackingEvent[]
}
