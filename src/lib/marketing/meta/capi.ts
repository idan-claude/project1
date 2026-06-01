import type { MetaEventPayload } from './events'
import { getMetaConfig } from '@/lib/settings/credentials'

const CAPI_URL = 'https://graph.facebook.com/v19.0'

export interface CAPIResult {
  ok: boolean
  eventsReceived?: number
  error?: string
  raw?: unknown
}

export async function sendMetaCAPIEvent(
  payload: MetaEventPayload,
  storeId = 'default'
): Promise<CAPIResult> {
  const cfg = await getMetaConfig(storeId)

  if (!cfg?.pixelId || !cfg?.capiToken) {
    return { ok: false, error: 'Meta Pixel or CAPI token not configured' }
  }

  const body: Record<string, unknown> = { data: [payload] }
  if (cfg.testCode) body.test_event_code = cfg.testCode

  try {
    const res = await fetch(`${CAPI_URL}/${cfg.pixelId}/events?access_token=${cfg.capiToken}`, {
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
  storeId?: string
}): Promise<CAPIResult> {
  const { buildPurchasePayload } = await import('./events')
  const payload = buildPurchasePayload(opts)
  return sendMetaCAPIEvent(payload, opts.storeId ?? 'default')
}
