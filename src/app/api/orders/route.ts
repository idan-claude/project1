import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import Product from '@/lib/db/models/Product'
import Coupon from '@/lib/db/models/Coupon'
import { generateOrderNumber } from '@/lib/utils/generateOrderNumber'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  await connectDB()
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const { customer, shippingAddress, items, couponCode, attribution } = body

  // Validate and price items from DB
  const pricedItems = []
  const inventoryDecrements: { productId: string; qty: number }[] = []
  let subtotal = 0

  for (const item of items) {
    let product = await Product.findById(item.productId).catch(() => null)
    if (!product) product = await Product.findOne({ slug: item.productId })
    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: `מוצר "${item.nameHe}" אינו זמין` }, { status: 400 })
    }

    // Resolve price: if a bundle is selected, use bundle.price as authoritative total for quantity=1 bundle unit
    let unitPrice = product.pricing.sellingPrice
    let physicalQty = item.quantity  // actual inventory units consumed
    if (item.variantLabel) {
      const bundle = product.bundles?.find(
        (b: { title: string; active?: boolean; price: number; quantity: number }) =>
          b.title === item.variantLabel && b.active !== false
      )
      if (bundle) {
        unitPrice = bundle.price
        physicalQty = bundle.quantity * item.quantity
      }
    }

    // Check stock against physical units the bundle consumes
    if (product.inventory.trackQuantity && product.inventory.quantity < physicalQty) {
      return NextResponse.json({ error: `${product.nameHe} — אין מלאי מספיק` }, { status: 400 })
    }

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
    inventoryDecrements.push({ productId: String(product._id), qty: physicalQty })
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

  const metaEventId = `Purchase_${(attribution?.sessionId || 'x')}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
  const tiktokEventId = `tt_PlaceAnOrder_${(attribution?.sessionId || 'x')}_${Date.now()}`

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
    testMode: process.env.PAYMENT_TEST_MODE === 'true',
    attribution: {
      sessionId:   attribution?.sessionId   || '',
      visitorId:   attribution?.visitorId   || '',
      source:      attribution?.source      || '',
      medium:      attribution?.medium      || '',
      campaign:    attribution?.campaign    || '',
      content:     attribution?.content     || '',
      term:        attribution?.term        || '',
      fbclid:      attribution?.fbclid      || '',
      fbp:         attribution?.fbp         || '',
      fbc:         attribution?.fbc         || '',
      ttclid:      attribution?.ttclid      || '',
      gclid:       attribution?.gclid       || '',
      referrer:    attribution?.referrer    || '',
      landingPage: attribution?.landingPage || '',
    },
    tracking: {
      metaPixelFired:   false,
      metaCapiFired:    false,
      tiktokPixelFired: false,
      tiktokCapiFired:  false,
      metaEventId,
      tiktokEventId,
    },
  })

  // Decrement inventory using physical units (bundles consume bundle.quantity units per selection)
  for (const { productId, qty } of inventoryDecrements) {
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'inventory.quantity': -qty },
    })
  }

  // Increment coupon usage
  if (appliedCoupon) {
    await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { uses: 1 } })
  }

  return NextResponse.json({ orderId: order._id.toString(), orderNumber: order.orderNumber, total })
}
