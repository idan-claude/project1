import type { TikTokEventPayload } from './events'

export interface TikTokAPIResult {
  ok: boolean
  code?: number
  message?: string
  error?: string
}

export async function sendTikTokEvent(payload: TikTokEventPayload): Promise<TikTokAPIResult> {
  const token = process.env.TIKTOK_EVENTS_API_TOKEN

  if (!process.env.TIKTOK_PIXEL_ID || !token) {
    return { ok: false, error: 'TIKTOK_PIXEL_ID or TIKTOK_EVENTS_API_TOKEN not configured' }
  }

  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': token,
      },
      body: JSON.stringify({ pixel_code: payload.pixel_code, event: payload.event, event_id: payload.event_id, timestamp: payload.timestamp, context: payload.context, properties: payload.properties, user: payload.user }),
    })

    const json = await res.json() as { code?: number; message?: string }

    if (!res.ok || (json.code && json.code !== 0)) {
      console.error('[TikTok Events API]', json)
      return { ok: false, code: json.code, message: json.message, error: json.message }
    }

    return { ok: true, code: json.code, message: json.message }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[TikTok Events API] network error:', msg)
    return { ok: false, error: msg }
  }
}

// Fire TikTok Purchase — ONLY call after payment.status === 'paid'
export async function fireTikTokPurchase(opts: Parameters<typeof import('./events')['buildTikTokPurchasePayload']>[0]): Promise<TikTokAPIResult> {
  const { buildTikTokPurchasePayload } = await import('./events')
  const payload = buildTikTokPurchasePayload(opts)
  return sendTikTokEvent(payload)
}
