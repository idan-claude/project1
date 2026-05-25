import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'

export const GET = withAdminAuth(async () => {
  await dbConnect()
  const products = await Product.find({}, {
    nameHe: 1, slug: 1, sku: 1, status: 1,
    'inventory.quantity': 1, 'inventory.lowStockThreshold': 1, 'inventory.trackQuantity': 1,
    'pricing.sellingPrice': 1, 'pricing.costPrice': 1,
  }).sort({ 'inventory.quantity': 1 }).lean()

  const items = products.map((p: any) => ({
    _id: p._id,
    nameHe: p.nameHe,
    slug: p.slug,
    sku: p.sku || '—',
    status: p.status,
    quantity: p.inventory?.quantity ?? 0,
    lowStockThreshold: p.inventory?.lowStockThreshold ?? 5,
    trackQuantity: p.inventory?.trackQuantity ?? true,
    sellingPrice: p.pricing?.sellingPrice ?? 0,
    stockStatus:
      !p.inventory?.trackQuantity ? 'untracked' :
      (p.inventory?.quantity ?? 0) === 0 ? 'out' :
      (p.inventory?.quantity ?? 0) <= (p.inventory?.lowStockThreshold ?? 5) ? 'low' : 'ok',
  }))

  const summary = {
    total: items.length,
    outOfStock: items.filter((i: any) => i.stockStatus === 'out').length,
    lowStock: items.filter((i: any) => i.stockStatus === 'low').length,
    healthy: items.filter((i: any) => i.stockStatus === 'ok').length,
  }

  return NextResponse.json({ items, summary })
})

export const PATCH = withAdminAuth(async (req: NextRequest) => {
  await dbConnect()
  const { productId, quantity, adjustment } = await req.json()
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  const update = adjustment !== undefined
    ? { $inc: { 'inventory.quantity': adjustment } }
    : { $set: { 'inventory.quantity': quantity } }

  const product = await Product.findByIdAndUpdate(productId, update, { new: true })
  if (!product) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json({ quantity: product.inventory.quantity })
})
