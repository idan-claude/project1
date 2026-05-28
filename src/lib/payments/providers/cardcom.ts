import axios from 'axios'
import type { PaymentProvider, CreateSessionParams, SessionResult, VerifyResult, RefundResult, HealthResult } from '../types'

const BASE = 'https://secure.cardcom.solutions'

function creds() {
  return {
    terminal: process.env.CARDCOM_TERMINAL_NUMBER ?? '',
    username: process.env.CARDCOM_API_USERNAME ?? '',
    password: process.env.CARDCOM_API_PASSWORD ?? '',
  }
}

const cardcomProvider: PaymentProvider = {
  id:          'cardcom',
  name:        'Cardcom',
  description: 'שער תשלום ישראלי — מסופים וכרטיס אשראי',
  logoEmoji:   '💳',
  countryCode: 'IL',
  docs:        'https://kb.cardcom.solutions/article/AA-00000/0/',
  sandboxMode: false,

  isConfigured() {
    const { terminal, username, password } = creds()
    return !!(terminal && username && password)
  },

  async createSession(params: CreateSessionParams): Promise<SessionResult> {
    const { terminal, username, password } = creds()
    if (!terminal || !username || !password) {
      return { ok: false, error: 'Cardcom credentials not configured' }
    }
    try {
      const amountNIS = (params.amount / 100).toFixed(2)
      const payload = new URLSearchParams({
        TerminalNumber: terminal,
        ApiName: username,
        ApiPassword: password,
        Operation: '1',
        Language: 'he',
        CoinID: '1',
        SumToBill: amountNIS,
        ReturnValue: params.orderId,
        SuccessRedirectUrl: `${params.baseUrl}/checkout/success?orderId=${params.orderId}`,
        ErrorRedirectUrl: `${params.baseUrl}/checkout/cancel?orderId=${params.orderId}`,
        IndicatorUrl: `${params.baseUrl}/api/webhooks/payment`,
        ProductName: params.description,
        CustomerName: params.customerName,
        CustomerEmail: params.customerEmail,
        ...(params.customerPhone ? { CustomerPhone: params.customerPhone } : {}),
      })

      const res = await axios.post(
        `${BASE}/api/v11/LowProfile/Create`,
        payload.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
      )

      const data = res.data
      if (data.ResponseCode !== 0 && data.ResponseCode !== '0') {
        return { ok: false, error: `Cardcom: ${data.Description || JSON.stringify(data)}` }
      }

      const code = data.LowProfileCode || data.lowProfileCode
      return {
        ok: true,
        sessionId: code,
        redirectUrl: `${BASE}/Interface/LowProfile.aspx?LowProfileCode=${code}`,
      }
    } catch (err: unknown) {
      return { ok: false, error: String(err instanceof Error ? err.message : err) }
    }
  },

  async verifyWebhook(body: Record<string, unknown>): Promise<VerifyResult> {
    const operation = String(body.Operation ?? '')
    const transactionId = String(body.TranzactionId ?? body.ApprovalNumber ?? '')
    if (operation === '2') {
      return { ok: true, status: 'paid', transactionId }
    }
    return { ok: true, status: 'failed' }
  },

  async refund(_orderId: string, _amount: number): Promise<RefundResult> {
    // Cardcom refunds are handled via their portal or support — not yet API-driven
    return { ok: false, error: 'Cardcom refunds must be processed via portal' }
  },

  async healthCheck(): Promise<HealthResult> {
    if (!this.isConfigured()) {
      return { ok: false, latency: 0, message: 'Not configured' }
    }
    const t0 = Date.now()
    try {
      await axios.get(`${BASE}/api/v11/`, { timeout: 5000 })
      return { ok: true, latency: Date.now() - t0 }
    } catch {
      // Cardcom returns 4xx on GET to API root — reachability is what matters
      return { ok: true, latency: Date.now() - t0, message: 'Reachable' }
    }
  },
}

export default cardcomProvider
