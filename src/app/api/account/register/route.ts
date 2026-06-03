import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'

export const dynamic = 'force-dynamic'

// In-memory register rate limit: 5 per IP per hour
const registerAttempts = new Map<string, { count: number; resetAt: number }>()
const REGISTER_LIMIT = 5
const REGISTER_WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const now = Date.now()
  const rec = registerAttempts.get(ip)

  if (rec && now < rec.resetAt) {
    if (rec.count >= REGISTER_LIMIT) {
      return NextResponse.json({ error: 'יותר מדי ניסיונות הרשמה. נסה שוב בעוד שעה.' }, { status: 429 })
    }
    rec.count++
  } else {
    registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_WINDOW_MS })
  }

  const { email, password, name, phone } = await req.json()

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'יש למלא שם, אימייל וסיסמה' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 })
  }

  await connectDB()
  const storeId = process.env.STORE_ID || 'default'
  const existing = await User.findOne({ storeId, email: email.toLowerCase().trim() })
  if (existing) {
    return NextResponse.json({ error: 'כתובת האימייל כבר רשומה' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({
    storeId,
    email: email.toLowerCase().trim(),
    passwordHash,
    name: name.trim(),
    phone: phone?.trim() ?? '',
    role: 'customer',
  })

  return NextResponse.json({ ok: true, userId: user._id.toString() }, { status: 201 })
}
