import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signAdminToken } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import AdminUser from '@/lib/db/models/AdminUser'
import Store from '@/lib/db/models/Store'
import StoreMember from '@/lib/db/models/StoreMember'

export const dynamic = 'force-dynamic'

function generateStoreId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9֐-׾\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 20)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

function generateSlug(name: string): string {
  // For Hebrew store names, use transliteration or random slug
  const hasHebrew = /[֐-׾]/.test(name)
  if (hasHebrew) {
    return `store-${Math.random().toString(36).slice(2, 8)}`
  }
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30) + `-${Math.random().toString(36).slice(2, 5)}`
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, storeName } = await req.json()

    if (!name || !email || !password || !storeName) {
      return NextResponse.json({ error: 'כל השדות נדרשים' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 })
    }

    await connectDB()

    const existing = await AdminUser.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'כתובת האימייל כבר רשומה' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const adminUser = await AdminUser.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      status: 'active',
      emailVerified: false,
    })

    const storeId = generateStoreId(storeName)
    const slug = generateSlug(storeName)

    const store = await Store.create({
      storeId,
      ownerId: adminUser._id,
      name: storeName,
      slug,
      subdomain: slug,
      status: 'setup',
      plan: 'free',
    })

    await StoreMember.create({
      storeId,
      userId: adminUser._id,
      role: 'owner',
      invitedBy: null,
      status: 'active',
      joinedAt: new Date(),
    })

    const token = signAdminToken({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      storeId,
      role: 'owner',
    })

    const res = NextResponse.json({ success: true, storeId, storeName })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'שגיאה בהרשמה, נסה שוב' }, { status: 500 })
  }
}
