import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import {
  saveCredentials,
  deleteCredentials,
  getSmtpConfig,
  getTwilioConfig,
  getMetaConfig,
  getTikTokConfig,
  getCardcomConfig,
  getCloudinaryConfig,
  getGa4Config,
} from '@/lib/settings/credentials'

export const dynamic = 'force-dynamic'

const ALLOWED_SERVICES = ['smtp', 'twilio', 'meta', 'tiktok', 'cardcom', 'cloudinary', 'aliexpress', 'ga4']

// Mask sensitive fields for display
function maskSecret(value: string | undefined | null): string {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.slice(-4)
}

async function getConfig(service: string, storeId: string) {
  switch (service) {
    case 'smtp': {
      const cfg = await getSmtpConfig(storeId)
      if (!cfg) return null
      return { ...cfg, pass: maskSecret(cfg.pass) }
    }
    case 'twilio': {
      const cfg = await getTwilioConfig(storeId)
      if (!cfg) return null
      return { ...cfg, authToken: maskSecret(cfg.authToken) }
    }
    case 'meta': {
      const cfg = await getMetaConfig(storeId)
      if (!cfg) return null
      return { ...cfg, capiToken: maskSecret(cfg.capiToken) }
    }
    case 'tiktok': {
      const cfg = await getTikTokConfig(storeId)
      if (!cfg) return null
      return { ...cfg, eventsApiToken: maskSecret(cfg.eventsApiToken) }
    }
    case 'cardcom': {
      const cfg = await getCardcomConfig(storeId)
      if (!cfg) return null
      return { ...cfg, password: maskSecret(cfg.password) }
    }
    case 'cloudinary': {
      const cfg = await getCloudinaryConfig(storeId)
      if (!cfg) return null
      return { ...cfg, apiSecret: maskSecret(cfg.apiSecret) }
    }
    case 'ga4': {
      const cfg = await getGa4Config(storeId)
      if (!cfg) return null
      return { ...cfg, apiSecret: maskSecret(cfg.apiSecret) }
    }
    default:
      return null
  }
}

// GET /api/admin/integrations/:service
export const GET = withAdminAuth(async (req: NextRequest, ctx) => {
  const service = ctx.params.service
  if (!ALLOWED_SERVICES.includes(service)) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 })
  }
  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  const config = await getConfig(service, storeId)
  return NextResponse.json({ service, configured: config !== null, config })
})

// POST /api/admin/integrations/:service — save credentials
export const POST = withAdminAuth(async (req: NextRequest, ctx) => {
  const service = ctx.params.service
  if (!ALLOWED_SERVICES.includes(service)) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 })
  }
  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  const body = await req.json()

  // Strip empty strings — don't overwrite existing secrets with blank
  const filtered: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (v !== '' && v !== null && v !== undefined) filtered[k] = v
  }

  await saveCredentials(storeId, service, filtered)
  const config = await getConfig(service, storeId)
  return NextResponse.json({ success: true, config })
})

// DELETE /api/admin/integrations/:service — disconnect
export const DELETE = withAdminAuth(async (req: NextRequest, ctx) => {
  const service = ctx.params.service
  if (!ALLOWED_SERVICES.includes(service)) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 })
  }
  const storeId = getAdminPayload(req)?.storeId ?? 'default'
  await deleteCredentials(storeId, service)
  return NextResponse.json({ success: true })
})
