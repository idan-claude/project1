import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import Order from '@/lib/db/models/Order'
import IpBlock from '@/lib/db/models/IpBlock'
import Settings from '@/lib/db/models/Settings'
import { PAID_FILTER, validateAnalyticsConsistency } from '@/lib/analytics/sourceOfTruth'
import { ALL_PROVIDERS } from '@/lib/payments/registry'

export const dynamic = 'force-dynamic'

interface TestResult {
  id: string
  name: string
  status: 'pass' | 'fail' | 'warn' | 'info'
  detail: string
  critical: boolean
}

export const GET = withAdminAuth(async () => {
  const t0 = Date.now()
  await connectDB()

  const results: TestResult[] = []

  // ── TEST 1: PAID_FILTER integrity — never behavioral ───────────────────────
  try {
    const paidFilter = PAID_FILTER as Record<string, unknown>
    const hasStatusPaid      = paidFilter['payment.status'] === 'paid'
    const hasTestModeFilter  = JSON.stringify(paidFilter.testMode) === JSON.stringify({ $ne: true })

    if (hasStatusPaid && hasTestModeFilter) {
      results.push({ id: 'paid_filter', name: 'PAID_FILTER integrity', status: 'pass', detail: "payment.status === 'paid' + testMode: { $ne: true } — מאומת", critical: true })
    } else {
      results.push({ id: 'paid_filter', name: 'PAID_FILTER integrity', status: 'fail', detail: 'PAID_FILTER לא מכיל את הפרמטרים הנדרשים — סכנה!', critical: true })
    }
  } catch (err) {
    results.push({ id: 'paid_filter', name: 'PAID_FILTER integrity', status: 'fail', detail: String(err), critical: true })
  }

  // ── TEST 2: Analytics consistency — behavioral ≠ purchase ─────────────────
  try {
    const consistency = await validateAnalyticsConsistency()
    if (consistency.ok) {
      results.push({
        id: 'analytics_consistency',
        name: 'Analytics — Behavior ≠ Purchase',
        status: 'pass',
        detail: `${consistency.paidOrders7d} הזמנות שולמו | ${consistency.checkoutCompleteEvents7d} checkout events (7d)`,
        critical: true,
      })
    } else {
      results.push({
        id: 'analytics_consistency',
        name: 'Analytics — Behavior ≠ Purchase',
        status: 'warn',
        detail: consistency.warnings[0] || 'אי-עקביות זוהתה',
        critical: true,
      })
    }
  } catch (err) {
    results.push({ id: 'analytics_consistency', name: 'Analytics — Behavior ≠ Purchase', status: 'fail', detail: String(err), critical: true })
  }

  // ── TEST 3: Database connectivity ──────────────────────────────────────────
  try {
    const count = await Order.countDocuments({ ...PAID_FILTER }).exec()
    results.push({ id: 'db_conn', name: 'חיבור למסד הנתונים', status: 'pass', detail: `MongoDB תקין — ${count} הזמנות שולמו סה"כ`, critical: true })
  } catch (err) {
    results.push({ id: 'db_conn', name: 'חיבור למסד הנתונים', status: 'fail', detail: String(err), critical: true })
  }

  // ── TEST 4: Payment provider configured ───────────────────────────────────
  try {
    const activeProvider = ALL_PROVIDERS.find(p => p.isConfigured())
    if (activeProvider) {
      results.push({ id: 'payment_provider', name: 'ספק תשלום מוגדר', status: 'pass', detail: `${activeProvider.name} — פעיל ומוגדר`, critical: true })
    } else {
      results.push({ id: 'payment_provider', name: 'ספק תשלום מוגדר', status: 'fail', detail: 'אין ספק תשלום מוגדר — לא ניתן לעבד תשלומים', critical: true })
    }
  } catch (err) {
    results.push({ id: 'payment_provider', name: 'ספק תשלום מוגדר', status: 'fail', detail: String(err), critical: true })
  }

  // ── TEST 5: IP blocking system ─────────────────────────────────────────────
  try {
    const blockCount = await IpBlock.countDocuments({ storeId: 'default', type: 'block' }).exec()
    results.push({ id: 'ip_blocking', name: 'מערכת חסימת IP', status: 'pass', detail: `${blockCount} כתובות חסומות — מערכת פעילה`, critical: false })
  } catch (err) {
    results.push({ id: 'ip_blocking', name: 'מערכת חסימת IP', status: 'warn', detail: String(err), critical: false })
  }

  // ── TEST 6: Meta Pixel configured ─────────────────────────────────────────
  const metaPixelId   = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
  const metaCapiToken = process.env.META_CAPI_TOKEN
  if (metaPixelId && metaCapiToken) {
    results.push({ id: 'meta_pixel', name: 'Meta Pixel + CAPI', status: 'pass', detail: `Pixel ${metaPixelId} + CAPI Token מוגדרים`, critical: false })
  } else if (metaPixelId) {
    results.push({ id: 'meta_pixel', name: 'Meta Pixel + CAPI', status: 'warn', detail: 'Pixel מוגדר אך CAPI Token חסר — דיוק מוגבל', critical: false })
  } else {
    results.push({ id: 'meta_pixel', name: 'Meta Pixel + CAPI', status: 'info', detail: 'Meta Pixel לא מוגדר', critical: false })
  }

  // ── TEST 7: TikTok configured ─────────────────────────────────────────────
  const ttPixelId = process.env.TIKTOK_PIXEL_ID || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
  const ttToken   = process.env.TIKTOK_EVENTS_API_TOKEN
  if (ttPixelId && ttToken) {
    results.push({ id: 'tiktok_pixel', name: 'TikTok Pixel + Events API', status: 'pass', detail: `Pixel ${ttPixelId} + Events API מוגדרים`, critical: false })
  } else {
    results.push({ id: 'tiktok_pixel', name: 'TikTok Pixel + Events API', status: 'info', detail: ttPixelId ? 'Pixel מוגדר, Events API חסר' : 'TikTok Pixel לא מוגדר', critical: false })
  }

  // ── TEST 8: Test orders not polluting production ───────────────────────────
  try {
    const testOrders = await Order.countDocuments({ testMode: true, 'payment.status': 'paid' }).exec()
    const realOrders = await Order.countDocuments({ ...PAID_FILTER }).exec()
    if (testOrders === 0) {
      results.push({ id: 'test_pollution', name: 'הפרדת הזמנות בדיקה', status: 'pass', detail: `אין הזמנות testMode בנתוני production (${realOrders} הזמנות אמיתיות)`, critical: true })
    } else {
      results.push({ id: 'test_pollution', name: 'הפרדת הזמנות בדיקה', status: 'warn', detail: `${testOrders} הזמנות testMode זוהו — PAID_FILTER מסנן אותן נכון`, critical: true })
    }
  } catch (err) {
    results.push({ id: 'test_pollution', name: 'הפרדת הזמנות בדיקה', status: 'fail', detail: String(err), critical: true })
  }

  // ── TEST 9: Settings DB accessible ────────────────────────────────────────
  try {
    await Settings.findOne({ storeId: 'default' }).lean()
    results.push({ id: 'settings_db', name: 'הגדרות מערכת', status: 'pass', detail: 'גישה להגדרות תקינה', critical: false })
  } catch (err) {
    results.push({ id: 'settings_db', name: 'הגדרות מערכת', status: 'warn', detail: String(err), critical: false })
  }

  // ── TEST 10: Webhook URL env ───────────────────────────────────────────────
  const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  if (baseUrl) {
    results.push({ id: 'webhook_url', name: 'Webhook Base URL', status: 'pass', detail: baseUrl, critical: false })
  } else {
    results.push({ id: 'webhook_url', name: 'Webhook Base URL', status: 'warn', detail: 'NEXTAUTH_URL לא מוגדר — Webhook URLs עשויים להיות שגויים', critical: false })
  }

  const criticalFails = results.filter(r => r.critical && r.status === 'fail').length
  const warnings      = results.filter(r => r.status === 'warn').length
  const passes        = results.filter(r => r.status === 'pass').length

  const overallStatus = criticalFails > 0 ? 'fail' : warnings > 0 ? 'warn' : 'pass'

  return NextResponse.json({
    overallStatus,
    summary: { passes, warnings, criticalFails, total: results.length, durationMs: Date.now() - t0 },
    results,
    checkedAt: new Date().toISOString(),
  })
})
