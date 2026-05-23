import crypto from 'crypto'
import axios from 'axios'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY || ''
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || ''
const API_URL = 'https://api-sg.aliexpress.com/sync'

function sign(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('')
  return crypto.createHmac('md5', APP_SECRET).update(APP_SECRET + sorted + APP_SECRET).digest('hex').toUpperCase()
}

async function callApi(method: string, extraParams: Record<string, string>) {
  const params: Record<string, string> = {
    method,
    app_key: APP_KEY,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    sign_method: 'hmac-md5',
    ...extraParams,
  }
  params.sign = sign(params)

  const res = await axios.post(API_URL, new URLSearchParams(params).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.data
}

export async function searchProducts(keyword: string, page = 1) {
  return callApi('aliexpress.affiliate.product.query', {
    keywords: keyword,
    page_no: String(page),
    page_size: '20',
    fields: 'product_id,product_title,product_main_image_url,target_sale_price,target_original_price,product_detail_url',
    target_currency: 'USD',
    target_language: 'EN',
  })
}

export async function getProductDetail(productId: string) {
  return callApi('aliexpress.ds.product.get', {
    product_id: productId,
    ship_to_country: 'IL',
    target_currency: 'USD',
    target_language: 'EN',
  })
}
