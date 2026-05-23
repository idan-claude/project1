import axios from 'axios'

const CARDCOM_BASE = 'https://secure.cardcom.solutions'
const TERMINAL = process.env.CARDCOM_TERMINAL_NUMBER!
const USERNAME = process.env.CARDCOM_API_USERNAME!
const PASSWORD = process.env.CARDCOM_API_PASSWORD!

export interface CardcomInitResult {
  lowProfileCode: string
  redirectUrl: string
}

export async function initiateCardcomPayment(params: {
  orderId: string
  amount: number  // in agorot
  customerName: string
  customerEmail: string
  description: string
  baseUrl: string
}): Promise<CardcomInitResult> {
  const amountNIS = params.amount / 100

  const payload = new URLSearchParams({
    TerminalNumber: TERMINAL,
    ApiName: USERNAME,
    ApiPassword: PASSWORD,
    Operation: '1',
    Language: 'he',
    CoinID: '1',                    // NIS
    SumToBill: amountNIS.toFixed(2),
    ReturnValue: params.orderId,
    SuccessRedirectUrl: `${params.baseUrl}/checkout/success?orderId=${params.orderId}`,
    ErrorRedirectUrl: `${params.baseUrl}/checkout/cancel?orderId=${params.orderId}`,
    IndicatorUrl: `${params.baseUrl}/api/webhooks/payment`,
    ProductName: params.description,
    CustomerName: params.customerName,
    CustomerEmail: params.customerEmail,
  })

  const res = await axios.post(
    `${CARDCOM_BASE}/api/v11/LowProfile/Create`,
    payload.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )

  const data = res.data
  if (data.ResponseCode !== 0 && data.ResponseCode !== '0') {
    throw new Error(`Cardcom error: ${data.Description || JSON.stringify(data)}`)
  }

  const lowProfileCode = data.LowProfileCode || data.lowProfileCode
  return {
    lowProfileCode,
    redirectUrl: `${CARDCOM_BASE}/Interface/LowProfile.aspx?LowProfileCode=${lowProfileCode}`,
  }
}
