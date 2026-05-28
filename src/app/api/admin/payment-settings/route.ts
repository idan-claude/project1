import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'
import { ALL_PROVIDERS, DEFAULT_SETTINGS, type ProviderSettings } from '@/lib/payments/registry'

export const dynamic = 'force-dynamic'

const SETTINGS_KEY = 'payment_providers'

async function loadSettings(): Promise<ProviderSettings[]> {
  const doc = await Settings.findOne({ storeId: 'default', key: SETTINGS_KEY }).lean()
  if (!doc) return DEFAULT_SETTINGS
  const saved = (doc.value as { providers?: ProviderSettings[] }).providers ?? []
  // Merge: ensure any new providers not in DB get defaults
  const savedMap = new Map(saved.map((s: ProviderSettings) => [s.providerId, s]))
  return ALL_PROVIDERS.map((p, i) => savedMap.get(p.id) ?? { providerId: p.id, enabled: false, priority: i })
}

export const GET = withAdminAuth(async () => {
  try {
    await connectDB()
    const settings = await loadSettings()
    const enriched = settings.map(s => {
      const provider = ALL_PROVIDERS.find(p => p.id === s.providerId)
      return {
        ...s,
        name: provider?.name ?? s.providerId,
        description: provider?.description ?? '',
        logoEmoji: provider?.logoEmoji ?? '💳',
        countryCode: provider?.countryCode ?? '',
        docs: provider?.docs ?? '',
        isConfigured: provider?.isConfigured() ?? false,
      }
    })
    return NextResponse.json({ providers: enriched })
  } catch (err) {
    console.error('[GET /api/admin/payment-settings]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
})

export const POST = withAdminAuth(async (req) => {
  try {
    await connectDB()
    const body = await req.json() as { providers: ProviderSettings[] }
    if (!Array.isArray(body.providers)) {
      return NextResponse.json({ error: 'providers array required' }, { status: 400 })
    }
    await Settings.findOneAndUpdate(
      { storeId: 'default', key: SETTINGS_KEY },
      { $set: { value: { providers: body.providers } } },
      { upsert: true, new: true }
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/admin/payment-settings]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
})
