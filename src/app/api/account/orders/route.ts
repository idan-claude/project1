import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const orders = await Order.find({
    'customer.userId': (session.user as { id: string }).id,
  }).sort({ createdAt: -1 })

  return NextResponse.json({ orders })
}
