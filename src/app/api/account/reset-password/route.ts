import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 })

  await connectDB()

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  })

  if (!user) return NextResponse.json({ error: 'הקישור אינו תקף או שפג תוקפו' }, { status: 400 })

  user.passwordHash = await bcrypt.hash(password, 12)
  user.resetToken = undefined
  user.resetTokenExpiry = undefined
  await user.save()

  return NextResponse.json({ success: true })
}
