import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { getProductDetail } from '@/lib/aliexpress/api'
import { mapAliexpressProduct } from '@/lib/aliexpress/mapper'
import { connectDB } from '@/lib/db/mongoose'
import Product from '@/lib/db/models/Product'
import { slugify } from '@/lib/utils/slugify'

export const POST = withAdminAuth(async (req) => {
  await connectDB()
  const { productId, nameHe, sellingPriceNIS, costPriceUSD, categoryId } = await req.json()

  let rawProduct: Record<string, unknown> = { product_id: productId }

  // Try to fetch full detail; if API not configured, use minimal data
  if (process.env.ALIEXPRESS_APP_KEY) {
    const detail = await getProductDetail(productId).catch(() => null)
    if (detail) rawProduct = { ...rawProduct, ...detail }
  }

  const mapped = mapAliexpressProduct(rawProduct, {
    nameHe,
    sellingPriceNIS: parseFloat(sellingPriceNIS),
    costPriceUSD: parseFloat(costPriceUSD || '0'),
    categoryId,
  })

  const slug = slugify(nameHe) + '-' + Date.now()
  const product = await Product.create({ ...mapped, slug })

  return NextResponse.json({ product }, { status: 201 })
})
