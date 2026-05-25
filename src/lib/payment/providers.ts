// Payment provider abstraction
// Add new providers here — all must implement PaymentProvider interface

export interface PaymentInitParams {
  orderId: string
  amount: number        // in agorot (1/100 NIS)
  customerName: string
  customerEmail: string
  customerPhone?: string
  description: string
  baseUrl: string
}

export interface PaymentInitResult {
  redirectUrl: string
  providerRef: string   // provider's internal reference (e.g. LowProfileCode)
}

export interface PaymentProvider {
  name: string
  initiatePayment(params: PaymentInitParams): Promise<PaymentInitResult>
}

// Registry — add providers as credentials become available
const PROVIDERS: Record<string, () => Promise<PaymentProvider>> = {
  cardcom: () => import('./cardcom-provider').then(m => m.default),
  // meshulam: () => import('./meshulam-provider').then(m => m.default),
  // stripe: () => import('./stripe-provider').then(m => m.default),
  // payplus: () => import('./payplus-provider').then(m => m.default),
  // tranzila: () => import('./tranzila-provider').then(m => m.default),
}

export async function getPaymentProvider(name = 'cardcom'): Promise<PaymentProvider> {
  const loader = PROVIDERS[name]
  if (!loader) throw new Error(`Unknown payment provider: ${name}`)
  return loader()
}
