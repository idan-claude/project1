import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import Product from '@/lib/db/models/Product'
import { generateOrderNumber } from '@/lib/utils/generateOrderNumber'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  await connectDB()
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const { customer, shippingAddress, items } = body

  // Validate and price items from DB
  const pricedItems = []
  let subtotal = 0

  for (const item of items) {
    const product = await Product.findById(item.productId)
    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: `מוצר "${item.nameHe}" אינו זמין` }, { status: 400 })
    }
    const unitPrice = product.pricing.sellingPrice
    const totalPrice = unitPrice * item.quantity
    subtotal += totalPrice
    pricedItems.push({
      productId: product._id,
      slug: product.slug,
      nameHe: product.nameHe,
      image: product.images[0]?.url ?? '',
      variantLabel: item.variantLabel ?? '',
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    })
  }

  const shippingCost = subtotal >= 30000 ? 0 : 2500 // free shipping over ₪300 (30000 agorot)
  const total = subtotal + shippingCost

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: {
      userId: (session?.user as { id?: string })?.id ?? null,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    shippingAddress,
    items: pricedItems,
    pricing: { subtotal, shippingCost, discount: 0, total },
    payment: { method: 'cardcom', status: 'pending' },
  })

  return NextResponse.json({ orderId: order._id.toString(), orderNumber: order.orderNumber, total })
}
