import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import AdminUser from '@/lib/db/models/AdminUser'
import StoreMember from '@/lib/db/models/StoreMember'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const storeId = getAdminPayload(req)?.storeId ?? 'default'

  const members = await StoreMember.find({ storeId, status: { $ne: 'removed' } })
    .populate<{ userId: { _id: string; email: string; name: string; status: string } }>('userId', 'email name status')
    .lean()

  return NextResponse.json({
    members: members.map(m => ({
      id: m._id,
      email: (m.userId as { email?: string })?.email ?? m.inviteEmail,
      name: (m.userId as { name?: string })?.name ?? '',
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    })),
  })
})

export const DELETE = withAdminAuth(async (req: NextRequest) => {
  await connectDB()
  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  const { memberId } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'חסר מזהה חבר צוות' }, { status: 400 })

  const member = await StoreMember.findOne({ _id: memberId, storeId })
  if (!member) return NextResponse.json({ error: 'חבר צוות לא נמצא' }, { status: 404 })
  if (member.role === 'owner') return NextResponse.json({ error: 'לא ניתן להסיר בעלים' }, { status: 403 })

  member.status = 'removed'
  await member.save()

  return NextResponse.json({ success: true })
})
