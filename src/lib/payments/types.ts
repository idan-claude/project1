export interface CreateSessionParams {
  orderId:       string
  amount:        number   // agorot
  customerName:  string
  customerEmail: string
  customerPhone?: string
  description:   string
  baseUrl:       string
}

export interface SessionResult {
  ok:          boolean
  redirectUrl?: string
  sessionId?:  string
  error?:      string
}

export interface VerifyResult {
  ok:         boolean
  status:     'paid' | 'failed' | 'pending'
  transactionId?: string
  error?:     string
}

export interface RefundResult {
  ok:     boolean
  refundId?: string
  error?: string
}

export interface HealthResult {
  ok:      boolean
  latency: number   // ms
  message?: string
}

export interface PaymentProvider {
  id:          string
  name:        string
  description: string
  logoEmoji:   string
  countryCode: string      // 'IL' | 'GLOBAL'
  docs:        string      // URL to docs
  sandboxMode: boolean

  createSession(params: CreateSessionParams): Promise<SessionResult>
  verifyWebhook(body: Record<string, unknown>): Promise<VerifyResult>
  refund(orderId: string, amount: number): Promise<RefundResult>
  healthCheck(): Promise<HealthResult>
  isConfigured(): boolean   // returns true if required env vars are present
}

export interface ProviderRegistryEntry {
  provider: PaymentProvider
  enabled:  boolean
  priority: number
}
