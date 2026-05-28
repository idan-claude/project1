import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { ALL_PROVIDERS } from '@/lib/payments/registry'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const targets = id
    ? ALL_PROVIDERS.filter(p => p.id === id)
    : ALL_PROVIDERS.filter(p => p.isConfigured())

  const results = await Promise.all(
    targets.map(async (p) => {
      const result = await p.healthCheck()
      return { id: p.id, name: p.name, ...result }
    })
  )

  return NextResponse.json({ results })
})
