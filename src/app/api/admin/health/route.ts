import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { connectDB } from '@/lib/db/mongoose'
import VisitorEvent from '@/lib/db/models/VisitorEvent'
import Order from '@/lib/db/models/Order'
import Product from '@/lib/db/models/Product'
import { PAID_FILTER, validateAnalyticsConsistency } from '@/lib/analytics/sourceOfTruth'

export const dynamic = 'force-dynamic'

type HealthStatus = 'healthy' | 'warning' | 'critical'

interface HealthCheck {
  name: string
  status: HealthStatus
  detail: string
  latencyMs?: number
}

async function checkMongoDB(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    await connectDB()
    const count = await VisitorEvent.countDocuments({}).maxTimeMS(5000)
    return {
      name: 'MongoDB Atlas',
      status: 'healthy',
      detail: `${count} visitor events`,
      latencyMs: Date.now() - start,
    }
  } catch (e) {
    return {
      name: 'MongoDB Atlas',
      status: 'critical',
      detail: String(e),
      latencyMs: Date.now() - start,
    }
  }
}

async function checkOrderTracking(): Promise<HealthCheck> {
  try {
    const last7 = new Date(Date.now() - 7 * 86400000)
    const [paidCount, pendingCount] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: last7 }, ...PAID_FILTER }),
      Order.countDocuments({ createdAt: { $gte: last7 }, 'payment.status': 'pending' }),
    ])
    return {
      name: 'מעקב הזמנות',
      status: 'healthy',
      detail: `${paidCount} הזמנות ששולמו, ${pendingCount} ממתינות (7 ימים)`,
    }
  } catch (e) {
    return { name: 'מעקב הזמנות', status: 'critical', detail: String(e) }
  }
}

async function checkVisitorTracking(): Promise<HealthCheck> {
  try {
    const last24h = new Date(Date.now() - 86400000)
    const recent = await VisitorEvent.countDocuments({ createdAt: { $gte: last24h } })
    if (recent === 0) {
      return { name: 'מעקב מבקרים', status: 'warning', detail: 'אין אירועי מעקב ב-24 שעות האחרונות' }
    }
    return { name: 'מעקב מבקרים', status: 'healthy', detail: `${recent} אירועים ב-24 שעות האחרונות` }
  } catch (e) {
    return { name: 'מעקב מבקרים', status: 'critical', detail: String(e) }
  }
}

function checkEnvVar(name: string, label: string): HealthCheck {
  const val = process.env[name]
  if (!val) {
    return { name: label, status: 'critical', detail: `${name} חסר` }
  }
  return { name: label, status: 'healthy', detail: 'מוגדר' }
}

function checkEnvVarOptional(name: string, label: string): HealthCheck {
  const val = process.env[name]
  if (!val) {
    return { name: label, status: 'warning', detail: `${name} לא מוגדר — תכונה לא תעבוד` }
  }
  return { name: label, status: 'healthy', detail: 'מוגדר' }
}

async function checkCardcom(): Promise<HealthCheck> {
  const hasTerminal = !!process.env.CARDCOM_TERMINAL_NUMBER
  const hasUser = !!process.env.CARDCOM_API_USERNAME
  const hasPass = !!process.env.CARDCOM_API_PASSWORD
  if (!hasTerminal || !hasUser || !hasPass) {
    const missing = [!hasTerminal && 'TERMINAL', !hasUser && 'USER', !hasPass && 'PASS'].filter(Boolean)
    return { name: 'Cardcom תשלום', status: 'critical', detail: `חסרים: ${missing.join(', ')}` }
  }
  return { name: 'Cardcom תשלום', status: 'healthy', detail: 'כל המפתחות מוגדרים' }
}

function checkTestMode(): HealthCheck {
  const testMode = process.env.PAYMENT_TEST_MODE === 'true'
  if (testMode) {
    return { name: 'מצב בדיקה', status: 'warning', detail: 'PAYMENT_TEST_MODE=true — הזמנות לא ייספרו כרכישות' }
  }
  return { name: 'מצב בדיקה', status: 'healthy', detail: 'כבוי — הזמנות אמיתיות' }
}

async function checkInventory(): Promise<HealthCheck> {
  try {
    const outOfStock = await Product.countDocuments({
      'inventory.trackQuantity': true,
      'inventory.quantity': { $lte: 0 },
      status: 'active',
    })
    const lowStock = await Product.countDocuments({
      'inventory.trackQuantity': true,
      $expr: { $lte: ['$inventory.quantity', '$inventory.lowStockThreshold'] },
      'inventory.quantity': { $gt: 0 },
      status: 'active',
    })
    if (outOfStock > 0) {
      return { name: 'מלאי מוצרים', status: 'critical', detail: `${outOfStock} מוצרים פעילים חסרי מלאי — לקוחות לא יכולים לרכוש` }
    }
    if (lowStock > 0) {
      return { name: 'מלאי מוצרים', status: 'warning', detail: `${lowStock} מוצרים עם מלאי נמוך` }
    }
    return { name: 'מלאי מוצרים', status: 'healthy', detail: 'כל המוצרים הפעילים זמינים' }
  } catch (e) {
    return { name: 'מלאי מוצרים', status: 'warning', detail: String(e) }
  }
}

async function checkRecentOrderAge(): Promise<HealthCheck> {
  try {
    const lastOrder = await Order.findOne(PAID_FILTER).sort({ createdAt: -1 }).select('createdAt').lean()
    if (!lastOrder) {
      return { name: 'הזמנה אחרונה', status: 'warning', detail: 'אין הזמנות ששולמו עדיין — לא בהכרח בעיה בחנות חדשה' }
    }
    const ageHours = (Date.now() - new Date(lastOrder.createdAt).getTime()) / 3600000
    if (ageHours > 24 * 7) {
      return { name: 'הזמנה אחרונה', status: 'warning', detail: `לפני ${Math.round(ageHours / 24)} ימים — בדוק שהחנות נגישה ו-Cardcom פעיל` }
    }
    return {
      name: 'הזמנה אחרונה',
      status: 'healthy',
      detail: ageHours < 1
        ? 'לפני פחות משעה'
        : ageHours < 24
          ? `לפני ${Math.round(ageHours)} שעות`
          : `לפני ${Math.round(ageHours / 24)} ימים`,
    }
  } catch (e) {
    return { name: 'הזמנה אחרונה', status: 'warning', detail: String(e) }
  }
}

async function checkAnalyticsConsistency(): Promise<HealthCheck> {
  try {
    const report = await validateAnalyticsConsistency()
    if (report.warnings.length > 0) {
      return {
        name: 'עקביות אנליטיקה',
        status: 'warning',
        detail: report.warnings[0],
      }
    }
    return {
      name: 'עקביות אנליטיקה',
      status: 'healthy',
      detail: `${report.paidOrders7d} הזמנות ששולמו, ${report.checkoutCompleteEvents7d} checkout events (7 ימים)`,
    }
  } catch (e) {
    return { name: 'עקביות אנליטיקה', status: 'critical', detail: String(e) }
  }
}

export const GET = withAdminAuth(async () => {
  try {
    await connectDB()

    const [
      mongoCheck,
      orderCheck,
      visitorCheck,
      cardcomCheck,
      analyticsCheck,
      inventoryCheck,
      lastOrderCheck,
    ] = await Promise.all([
      checkMongoDB(),
      checkOrderTracking(),
      checkVisitorTracking(),
      checkCardcom(),
      checkAnalyticsConsistency(),
      checkInventory(),
      checkRecentOrderAge(),
    ])

    const envChecks: HealthCheck[] = [
      checkEnvVar('MONGODB_URI', 'MongoDB URI'),
      checkEnvVar('ADMIN_JWT_SECRET', 'Admin JWT Secret'),
      checkEnvVar('ADMIN_EMAIL', 'Admin Email'),
      checkEnvVar('ADMIN_PASSWORD', 'Admin Password'),
      checkEnvVarOptional('CLOUDINARY_CLOUD_NAME', 'Cloudinary'),
      checkEnvVarOptional('SMTP_HOST', 'SMTP Email'),
      checkEnvVarOptional('TWILIO_ACCOUNT_SID', 'Twilio WhatsApp'),
      checkTestMode(),
    ]

    const checks: HealthCheck[] = [
      mongoCheck,
      orderCheck,
      lastOrderCheck,
      visitorCheck,
      cardcomCheck,
      analyticsCheck,
      inventoryCheck,
      ...envChecks,
    ]

    const criticalCount = checks.filter(c => c.status === 'critical').length
    const warningCount = checks.filter(c => c.status === 'warning').length
    const overallStatus: HealthStatus = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy'

    return NextResponse.json({
      overallStatus,
      criticalCount,
      warningCount,
      checks,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({
      overallStatus: 'critical',
      criticalCount: 1,
      warningCount: 0,
      checks: [{ name: 'System', status: 'critical', detail: String(err) }],
      generatedAt: new Date().toISOString(),
    }, { status: 500 })
  }
})
