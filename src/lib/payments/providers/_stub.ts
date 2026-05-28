import type { PaymentProvider, CreateSessionParams, SessionResult, VerifyResult, RefundResult, HealthResult } from '../types'

export function makeStub(opts: {
  id: string
  name: string
  description: string
  logoEmoji: string
  countryCode: string
  docs: string
  envKeys: string[]
}): PaymentProvider {
  return {
    ...opts,
    sandboxMode: false,

    isConfigured() {
      return opts.envKeys.every(k => !!process.env[k])
    },

    async createSession(_params: CreateSessionParams): Promise<SessionResult> {
      return { ok: false, error: `${opts.name} is not yet integrated` }
    },

    async verifyWebhook(_body: Record<string, unknown>): Promise<VerifyResult> {
      return { ok: false, status: 'failed', error: `${opts.name} webhook not integrated` }
    },

    async refund(_orderId: string, _amount: number): Promise<RefundResult> {
      return { ok: false, error: `${opts.name} refund not integrated` }
    },

    async healthCheck(): Promise<HealthResult> {
      if (!this.isConfigured()) return { ok: false, latency: 0, message: 'Not configured' }
      return { ok: false, latency: 0, message: `${opts.name} health check not implemented` }
    },
  }
}
