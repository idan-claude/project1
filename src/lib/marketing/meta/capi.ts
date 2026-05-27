import type { MetaEventPayload } from './events'

const CAPI_URL = 'https://graph.facebook.com/v19.0'

export interface CAPIResult {
  ok: boolean
  eventsReceived?: number
  error?: string
  raw?: unknown
}

export async function sendMetaCAPIEvent(payload: MetaEventPayload): Promise<CAPIResult> {
  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN

  if (!pixelId || !token) {
    return { ok: false, error: 'META_PIXEL_ID or META_CAPI_TOKEN not configured' }
  }

  const testCode = process.env.META_CAPI_TEST_CODE
  const body: Record<string, unknown> = { data: [payload] }
  if (testCode) body.test_event_code = testCode

  try {
    const res = await fetch(`${CAPI_URL}/${pixelId}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json() as { events_received?: number; error?: { message: string } }

    if (!res.ok || json.error) {
      console.error('[Meta CAPI]', json.error)
      return { ok: false, error: json.error?.message || `HTTP ${res.status}`, raw: json }
    }

    return { ok: true, eventsReceived: json.events_received, raw: json }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Meta CAPI] network error:', msg)
    return { ok: false, error: msg }
  }
}

// Fire Purchase CAPI — ONLY call after payment.status === 'paid' is confirmed
export async function fireMetaPurchase(opts: {
  orderId: string
  sessionId: string
  totalAgorot: number
  items: Array<{ id: string; quantity: number; unitPrice: number }>
  email?: string
  phone?: string
  ip?: string
  userAgent?: string
  fbp?: string
  fbc?: string
  pageUrl?: string
  existingEventId?: string
}): Promise<CAPIResult> {
  const { buildPurchasePayload } = await import('./events')
  const payload = buildPurchasePayload(opts)
  return sendMetaCAPIEvent(payload)
}
