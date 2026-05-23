export interface CartItem {
  productId: string
  slug: string
  nameHe: string
  image: string
  sellingPrice: number // agorot
  quantity: number
  variantLabel: string
}

export interface CheckoutFormData {
  name: string
  email: string
  phone: string
  street: string
  city: string
  zip: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
