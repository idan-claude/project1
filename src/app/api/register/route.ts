import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'

export async function POST(req: NextRequest) {
  await connectDB()
  const { name, email, password, phone } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'שם, אימייל וסיסמה הם שדות חובה' }, { status: 400 })
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    return NextResponse.json({ error: 'כתובת האימייל כבר רשומה במערכת' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, phone: phone || '' })

  return NextResponse.json({ userId: user._id.toString() }, { status: 201 })
}
