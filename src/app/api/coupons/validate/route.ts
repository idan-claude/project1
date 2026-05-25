import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Coupon from '@/lib/db/models/Coupon'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { code, subtotal } = await req.json()
    if (!code) return NextResponse.json({ error: 'קוד קופון חסר' }, { status: 400 })

    const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim(), active: true })
    if (!coupon) return NextResponse.json({ error: 'קוד קופון לא קיים או לא פעיל' }, { status: 400 })

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

    let discount = 0
    if (coupon.type === 'percent') {
      discount = Math.round(subtotal * (coupon.value / 100))
    } else {
      discount = Math.min(coupon.value, subtotal)
    }

    return NextResponse.json({ discount, type: coupon.type, value: coupon.value })
  } catch (err) {
    console.error('[POST /api/coupons/validate]', err)
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}
