import { TrackingStatus, TrackingEvent, ShipmentInfo } from './types'

const BASE = 'https://api.17track.net/track/v2.2'

function headers(): Record<string, string> {
  return {
    '17token': process.env.TRACK17_API_KEY || '',
    'Content-Type': 'application/json',
  }
}

/**
 * Map a 17TRACK numeric track_status code to our TrackingStatus enum.
 * Fine-grained detection (customs, out_for_delivery, etc.) is applied
 * separately via description / location analysis.
 */
function mapStatusCode(code: number): TrackingStatus {
  switch (code) {
    case 0:
      return 'pending'
    case 10:
      return 'not_found'
    case 20:
      return 'in_transit'
    case 30:
      return 'not_found'
    case 35:
      return 'not_found'
    case 40:
      return 'failed_delivery'
    case 50:
      return 'pickup_available'
    case 60:
      return 'returned'
    case 65:
      return 'returned'
    case 70:
      return 'delivered'
    case 80:
      return 'pickup_available'
    default:
      return 'in_transit'
  }
}

/**
 * Apply fine-grained status detection based on description and location text.
 * Overrides the base status from the status code when a more specific match is found.
 */
function refineStatus(
  base: TrackingStatus,
  description: string,
  location: string
): TrackingStatus {
  const desc = description.toLowerCase()
  const loc = location.toLowerCase()

  if (
    desc.includes('delay') ||
    desc.includes('delayed') ||
    desc.includes('עיכוב')
  ) {
    return 'delayed'
  }

  if (
    desc.includes('out for delivery') ||
    desc.includes('delivery courier')
  ) {
    return 'out_for_delivery'
  }

  if (
    desc.includes('customs') ||
    desc.includes('מכס') ||
    desc.includes('clearance') ||
    desc.includes('Customs')
  ) {
    return 'customs'
  }

  if (
    loc.includes('israel') ||
    loc.includes('ישראל') ||
    loc.includes('tel aviv') ||
    loc.includes(', il') ||
    loc.endsWith(' il') ||
    loc === 'il'
  ) {
    if (base === 'in_transit') {
      return 'arrived_destination'
    }
  }

  return base
}

function parseEvent(
  raw: Record<string, unknown>,
  baseStatus: TrackingStatus
): TrackingEvent {
  const timeRaw = (raw['time_iso'] as string | undefined) || ''
  const description = (raw['description'] as string | undefined) || ''
  const location = (raw['location'] as string | undefined) || ''
  const timestamp = timeRaw ? new Date(timeRaw) : new Date()
  const status = refineStatus(baseStatus, description, location)

  return {
    timestamp,
    description,
    location,
    status,
    raw,
  }
}

/**
 * Register tracking numbers with 17TRACK.
 * POST /register with array of { number, carrier? }
 */
export async function registerTracking(numbers: string[]): Promise<void> {
  if (!numbers.length) return

  const body = numbers.map((n) => ({ number: n }))

  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `17TRACK register failed: HTTP ${res.status} — ${text}`
    )
  }

  const json = (await res.json()) as { code: number; message?: string }
  if (json.code !== 0 && json.code !== 200) {
    throw new Error(
      `17TRACK register error: code ${json.code} — ${json.message || 'unknown'}`
    )
  }
}

/**
 * Fetch full tracking info for a list of tracking numbers.
 * POST /gettrackinfo with array of { number }
 */
export async function getTrackingInfo(
  numbers: string[]
): Promise<ShipmentInfo[]> {
  if (!numbers.length) return []

  const body = numbers.map((n) => ({ number: n }))

  const res = await fetch(`${BASE}/gettrackinfo`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `17TRACK gettrackinfo failed: HTTP ${res.status} — ${text}`
    )
  }

  const json = (await res.json()) as {
    code: number
    message?: string
    data?: {
      accepted?: Array<{
        number: string
        carrier?: string | number
        track_status?: number
        track_status_name?: string
        latest_event?: Record<string, unknown>
        tracking_events?: Array<Record<string, unknown>>
        time_metrics?: Record<string, unknown>
      }>
      rejected?: Array<{ number: string; error?: Record<string, unknown> }>
    }
  }

  if (json.code !== 0 && json.code !== 200) {
    throw new Error(
      `17TRACK gettrackinfo error: code ${json.code} — ${json.message || 'unknown'}`
    )
  }

  const accepted = json.data?.accepted || []
  const results: ShipmentInfo[] = []

  for (const item of accepted) {
    const baseStatus = mapStatusCode(item.track_status ?? 0)

    const rawEvents: Array<Record<string, unknown>> =
      item.tracking_events || []

    // Parse all events (oldest first, reverse chronological from API)
    const events: TrackingEvent[] = rawEvents
      .map((ev) => parseEvent(ev, baseStatus))
      .reverse()

    // Determine final status — use latest event's refined status if available
    let finalStatus: TrackingStatus = baseStatus
    if (item.latest_event) {
      finalStatus = refineStatus(
        baseStatus,
        (item.latest_event['description'] as string) || '',
        (item.latest_event['location'] as string) || ''
      )
    } else if (events.length > 0) {
      finalStatus = events[events.length - 1].status
    }

    // Extract estimated delivery from time_metrics if present
    let estimatedDelivery: Date | undefined
    const timeMetrics = item.time_metrics as Record<string, unknown> | undefined
    if (timeMetrics) {
      const eta =
        (timeMetrics['estimated_delivery_date'] as string | undefined) ||
        (timeMetrics['scheduled_delivery_date'] as string | undefined)
      if (eta) estimatedDelivery = new Date(eta)
    }

    results.push({
      trackingNumber: item.number,
      carrier: item.carrier ? String(item.carrier) : undefined,
      status: finalStatus,
      estimatedDelivery,
      events,
      lastUpdated: new Date(),
    })
  }

  return results
}

/**
 * Parse a raw 17TRACK webhook body into a normalised array of tracking updates.
 * Supports both single-object and array webhook formats.
 */
export function parse17TrackWebhook(
  body: unknown
): Array<{ trackingNumber: string; status: TrackingStatus; events: TrackingEvent[] }> {
  const items: Array<Record<string, unknown>> = []

  if (Array.isArray(body)) {
    for (const item of body) {
      if (item && typeof item === 'object') {
        items.push(item as Record<string, unknown>)
      }
    }
  } else if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>
    // Handle envelope with .data array
    if (obj['data'] && Array.isArray(obj['data'])) {
      for (const item of obj['data'] as unknown[]) {
        if (item && typeof item === 'object') {
          items.push(item as Record<string, unknown>)
        }
      }
    } else {
      items.push(obj)
    }
  }

  return items.map((item) => {
    const trackingNumber = (item['number'] as string | undefined) || ''
    const trackStatus = (item['track_status'] as number | undefined) ?? 0
    const baseStatus = mapStatusCode(trackStatus)

    const latestRaw = item['latest_event'] as Record<string, unknown> | undefined
    const rawEvents = (item['tracking_events'] as Array<Record<string, unknown>> | undefined) || []

    let finalStatus = baseStatus
    if (latestRaw) {
      finalStatus = refineStatus(
        baseStatus,
        (latestRaw['description'] as string) || '',
        (latestRaw['location'] as string) || ''
      )
    }

    const events: TrackingEvent[] = rawEvents
      .map((ev) => parseEvent(ev, baseStatus))
      .reverse()

    return {
      trackingNumber,
      status: finalStatus,
      events,
    }
  })
}
