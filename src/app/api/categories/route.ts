import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Category from '@/lib/db/models/Category'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connectDB()
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, nameHe: 1 })
  return NextResponse.json({ categories })
}
