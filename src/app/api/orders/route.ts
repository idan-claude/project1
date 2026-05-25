import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import Product from '@/lib/db/models/Product'
import Coupon from '@/lib/db/models/Coupon'
import { generateOrderNumber } from '@/lib/utils/generateOrderNumber'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  await connectDB()
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const { customer, shippingAddress, items, couponCode } = body

  // Validate and price items from DB
  const pricedItems = []
  let subtotal = 0

  for (const item of items) {
    let product = await Product.findById(item.productId).catch(() => null)
    if (!product) product = await Product.findOne({ slug: item.productId })
    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: `מוצר "${item.nameHe}" אינו זמין` }, { status: 400 })
    }
    // Check stock if tracking is enabled
    if (product.inventory.trackQuantity && product.inventory.quantity < item.quantity) {
      return NextResponse.json({ error: `${product.nameHe} — אין מלאי מספיק` }, { status: 400 })
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

  // Validate coupon if provided
  let discount = 0
  let appliedCoupon = null
  if (couponCode) {
    const code = String(couponCode).toUpperCase().trim()
    const coupon = await Coupon.findOne({ code, active: true })
    if (!coupon) {
      return NextResponse.json({ error: 'קוד קופון לא תקין' }, { status: 400 })
    }
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: 'קוד הקופון פג תוקף' }, { status: 400 })
    }
    if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
      return NextResponse.json({ error: 'קוד הקופון מוצה' }, { status: 400 })
    }
    if (coupon.minOrder !== null && subtotal < coupon.minOrder) {
      return NextResponse.json({
        error: `מינימום הזמנה לקופון זה: ₪${(coupon.minOrder / 100).toFixed(0)}`,
      }, { status: 400 })
    }
    if (coupon.type === 'percent') {
      discount = Math.round(subtotal * (coupon.value / 100))
    } else {
      discount = Math.min(coupon.value, subtotal)
    }
    appliedCoupon = coupon
  }

  const shippingCost = 0
  const total = subtotal - discount + shippingCost

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
    pricing: { subtotal, shippingCost, discount, total },
    payment: { method: 'cardcom', status: 'pending' },
  })

  // Decrement inventory for each item
  for (const item of pricedItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { 'inventory.quantity': -item.quantity },
    })
  }

  // Increment coupon usage
  if (appliedCoupon) {
    await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { uses: 1 } })
  }

  return NextResponse.json({ orderId: order._id.toString(), orderNumber: order.orderNumber, total })
}
