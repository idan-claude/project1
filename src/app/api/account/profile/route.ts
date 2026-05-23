import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'
import { connectDB } from '@/lib/db/mongoose'
import User from '@/lib/db/models/User'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findById((session.user as { id: string }).id, '-passwordHash')
  return NextResponse.json({ user })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { name, phone, addresses } = await req.json()
  const user = await User.findByIdAndUpdate(
    (session.user as { id: string }).id,
    { name, phone, addresses },
    { new: true, select: '-passwordHash' }
  )
  return NextResponse.json({ user })
}
