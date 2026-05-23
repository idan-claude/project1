import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { searchProducts } from '@/lib/aliexpress/api'

export const GET = withAdminAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')

  if (!q) return NextResponse.json({ products: [] })

  const data = await searchProducts(q, page)
  // AliExpress API wraps results — extract the list
  const result =
    data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product ||
    data?.products ||
    []

  return NextResponse.json({ products: result })
})
