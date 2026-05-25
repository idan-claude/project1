import type { PaymentProvider, PaymentInitParams, PaymentInitResult } from './providers'
import { initiateCardcomPayment } from './cardcom'

const CardcomProvider: PaymentProvider = {
  name: 'cardcom',
  async initiatePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
    const result = await initiateCardcomPayment({
      orderId: params.orderId,
      amount: params.amount,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      description: params.description,
      baseUrl: params.baseUrl,
    })
    return {
      redirectUrl: result.redirectUrl,
      providerRef: result.lowProfileCode,
    }
  },
}

export default CardcomProvider
