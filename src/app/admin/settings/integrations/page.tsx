'use client'
import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceConfig {
  service: string
  configured: boolean
  config: Record<string, string | number | boolean> | null
}

interface IntegrationDef {
  id: string
  label: string
  description: string
  whatIsIt: string
  whyNeedIt: string
  category: 'payment' | 'pixel' | 'messaging' | 'storage'
  fields: FieldDef[]
  docsUrl?: string
}

interface FieldDef {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'password' | 'number' | 'tel'
  hint?: string
  sensitive?: boolean
}

// ─── Integration definitions ──────────────────────────────────────────────────

const INTEGRATIONS: IntegrationDef[] = [
  {
    id: 'cardcom',
    label: 'Cardcom — קבלת תשלומים',
    description: 'אשראי, ביט, PayBox',
    whatIsIt: 'Cardcom הוא שער תשלום ישראלי שמאפשר ללקוחות לשלם בכרטיס אשראי, ביט, ו-PayBox.',
    whyNeedIt: 'ללא ספק תשלום, הלקוחות לא יוכלו לשלם בחנות.',
    category: 'payment',
    docsUrl: 'https://www.cardcom.solutions',
    fields: [
      { key: 'terminal', label: 'מספר מסוף', placeholder: 'לדוגמה: 1000', type: 'text', hint: 'נמצא בלוח הבקרה של Cardcom תחת "פרטי חשבון"' },
      { key: 'username', label: 'שם משתמש', placeholder: 'שם משתמש מ-Cardcom', type: 'text', hint: 'שם המשתמש של החשבון ב-Cardcom' },
      { key: 'password', label: 'סיסמה', placeholder: '••••••••', type: 'password', sensitive: true, hint: 'סיסמת החשבון ב-Cardcom' },
    ],
  },
  {
    id: 'meta',
    label: 'Meta Ads — מעקב מכירות',
    description: 'Facebook, Instagram',
    whatIsIt: 'Meta Pixel מאפשר לדעת מאיזה פרסומת ב-Facebook/Instagram הגיעה כל מכירה.',
    whyNeedIt: 'ללא מעקב, Meta לא יכול לאופטימיזציה את הפרסומות שלך — תבזבז כסף על פרסום שלא עובד.',
    category: 'pixel',
    docsUrl: 'https://www.facebook.com/events_manager',
    fields: [
      { key: 'pixelId', label: 'Pixel ID', placeholder: 'לדוגמה: 123456789012345', type: 'text', hint: 'Events Manager → מקורות נתונים → Pixel ID' },
      { key: 'capiToken', label: 'קוד גישה לשרת', placeholder: '••••••••', type: 'password', sensitive: true, hint: 'Business Settings → System Users → Generate Token' },
      { key: 'testCode', label: 'קוד בדיקה (אופציונלי)', placeholder: 'TEST12345', type: 'text', hint: 'רק לבדיקות — מחק לפני עלייה לאוויר' },
    ],
  },
  {
    id: 'tiktok',
    label: 'TikTok Ads — מעקב מכירות',
    description: 'TikTok for Business',
    whatIsIt: 'TikTok Pixel מאפשר לדעת מאיזה סרטון או פרסומת ב-TikTok הגיעה כל מכירה.',
    whyNeedIt: 'ללא מעקב TikTok, לא ניתן לאופטימיזציה את הפרסומות ולשיפור ה-ROI.',
    category: 'pixel',
    docsUrl: 'https://ads.tiktok.com/marketing_api/homepage',
    fields: [
      { key: 'pixelId', label: 'Pixel ID', placeholder: 'לדוגמה: C89ABCDEF12345', type: 'text', hint: 'TikTok Ads Manager → Events → Manage → Pixel ID' },
      { key: 'eventsApiToken', label: 'קוד גישה לשרת', placeholder: '••••••••', type: 'password', sensitive: true, hint: 'TikTok Ads → Events → Manage → Generate Access Token' },
    ],
  },
  {
    id: 'smtp',
    label: 'מיילים אוטומטיים',
    description: 'אישור הזמנה, עדכוני משלוח',
    whatIsIt: 'שליחת מיילים אוטומטיים ללקוחות — אישור הזמנה, עדכוני משלוח, חשבוניות.',
    whyNeedIt: 'ללקוחות מצפים לקבל אישור מיידי לאחר רכישה. ללא מייל, תקבל שאלות מלקוחות מבולבלים.',
    category: 'messaging',
    fields: [
      { key: 'host', label: 'שרת מייל', placeholder: 'smtp.gmail.com', type: 'text', hint: 'לרוב: smtp.gmail.com או mail.yourdomain.com' },
      { key: 'port', label: 'פורט', placeholder: '587', type: 'number', hint: 'בדרך כלל 587 (TLS) או 465 (SSL)' },
      { key: 'user', label: 'כתובת שולח', placeholder: 'orders@yourstore.com', type: 'text', hint: 'הכתובת ממנה יישלחו המיילים' },
      { key: 'pass', label: 'סיסמת אפליקציה', placeholder: '••••••••', type: 'password', sensitive: true, hint: 'ב-Gmail: הגדרות → אבטחה → סיסמאות אפליקציה' },
      { key: 'adminEmail', label: 'מייל להתראות', placeholder: 'owner@yourstore.com', type: 'text', hint: 'לאן תישלחנה התראות על הזמנות חדשות' },
    ],
  },
  {
    id: 'twilio',
    label: 'WhatsApp עסקי',
    description: 'הודעות אוטומטיות ללקוחות',
    whatIsIt: 'שליחת הודעות WhatsApp אוטומטיות ללקוחות ולבעל העסק על הזמנות חדשות.',
    whyNeedIt: 'WhatsApp הוא ערוץ התקשורת המועדף בישראל. לקוחות מעדיפים לקבל עדכונים בוואטסאפ.',
    category: 'messaging',
    fields: [
      { key: 'accountSid', label: 'מזהה חשבון Twilio', placeholder: 'ACxxxxxxxxxx', type: 'text', hint: 'נמצא בדשבורד הראשי של Twilio' },
      { key: 'authToken', label: 'קוד גישה', placeholder: '••••••••', type: 'password', sensitive: true, hint: 'נמצא ליד מזהה החשבון בדשבורד Twilio' },
      { key: 'fromNumber', label: 'מספר WhatsApp שולח', placeholder: '+14155238886', type: 'tel', hint: 'מספר WhatsApp ה-Business של Twilio' },
      { key: 'adminNumber', label: 'הוואטסאפ שלך', placeholder: '+972501234567', type: 'tel', hint: 'לאן תישלחנה התראות על הזמנות חדשות' },
    ],
  },
  {
    id: 'cloudinary',
    label: 'אחסון תמונות',
    description: 'Cloudinary — תמונות מוצרים',
    whatIsIt: 'Cloudinary מאחסן את תמונות המוצרים שלך בענן ומגיש אותן מהר לכל לקוח.',
    whyNeedIt: 'ללא אחסון תמונות, לא ניתן להעלות תמונות למוצרים.',
    category: 'storage',
    docsUrl: 'https://cloudinary.com',
    fields: [
      { key: 'cloudName', label: 'שם החשבון', placeholder: 'my-store', type: 'text', hint: 'Dashboard → Account Details → Cloud name' },
      { key: 'apiKey', label: 'מפתח גישה', placeholder: '123456789012345', type: 'text', hint: 'Dashboard → Settings → Security → API Keys' },
      { key: 'apiSecret', label: 'סיסמת גישה', placeholder: '••••••••', type: 'password', sensitive: true, hint: 'נמצאת ליד מפתח הגישה' },
    ],
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  payment: 'תשלומים',
  pixel: 'מעקב מכירות',
  messaging: 'תקשורת עם לקוחות',
  storage: 'אחסון',
}

const CATEGORY_ORDER = ['payment', 'pixel', 'messaging', 'storage']

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
      configured
        ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
        : 'bg-white/[0.04] border-white/[0.055] text-[var(--ds-text-3)]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${configured ? 'bg-emerald-400' : 'bg-[var(--ds-text-3)]'}`} />
      {configured ? 'מחובר' : 'לא מחובר'}
    </span>
  )
}

function IntegrationCard({
  def,
  serviceConfig,
  onSave,
}: {
  def: IntegrationDef
  serviceConfig: ServiceConfig | undefined
  onSave: (id: string, data: Record<string, string | number | boolean>) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const configured = serviceConfig?.configured ?? false

  function openSetup() {
    const existing = serviceConfig?.config ?? {}
    const prefilled: Record<string, string> = {}
    for (const f of def.fields) {
      prefilled[f.key] = String(existing[f.key] ?? '')
    }
    setForm(prefilled)
    setTestResult(null)
    setOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const data: Record<string, string | number | boolean> = {}
    for (const f of def.fields) {
      const v = form[f.key]
      if (v) data[f.key] = f.type === 'number' ? Number(v) : v
    }
    await onSave(def.id, data)
    setSaving(false)
    setOpen(false)
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/admin/integrations/${def.id}/test`, { method: 'POST' })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ ok: false, message: 'שגיאת רשת' })
    }
    setTesting(false)
  }

  return (
    <div className={`bg-[#0E1629] border rounded-2xl overflow-hidden transition-all ${configured ? 'border-emerald-500/15' : 'border-white/[0.055]'}`}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-[var(--ds-text-1)]">{def.label}</p>
            <StatusBadge configured={configured} />
          </div>
          <p className="text-[11px] text-[var(--ds-text-3)] mt-0.5">{def.description}</p>
        </div>
        <button
          onClick={openSetup}
          className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            configured
              ? 'bg-white/[0.04] border border-white/[0.055] text-[var(--ds-text-2)] hover:bg-white/[0.07]'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {configured ? 'ערוך' : 'חבר'}
        </button>
      </div>

      {/* Setup panel */}
      {open && (
        <div className="border-t border-white/[0.055] p-5 space-y-5 bg-[#070B14]/60">
          {/* What / Why */}
          <div className="bg-blue-500/10 border border-blue-500/15 rounded-xl p-4 space-y-2">
            <p className="text-[12px] text-blue-300 font-medium">מה זה?</p>
            <p className="text-[12px] text-[var(--ds-text-2)]">{def.whatIsIt}</p>
            <p className="text-[12px] text-blue-300 font-medium mt-2">למה אני צריך את זה?</p>
            <p className="text-[12px] text-[var(--ds-text-2)]">{def.whyNeedIt}</p>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            {def.fields.map(field => (
              <div key={field.key}>
                <label className="block text-[12px] font-medium text-[var(--ds-text-2)] mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key] ?? ''}
                  onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.sensitive && serviceConfig?.config?.[field.key] ? '(שמור — הזן מחדש לשינוי)' : field.placeholder}
                  className="w-full bg-[#0E1629] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-[var(--ds-text-1)] placeholder:text-[var(--ds-text-3)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
                {field.hint && <p className="text-[10px] text-[var(--ds-text-3)] mt-1">{field.hint}</p>}
              </div>
            ))}
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`rounded-xl px-4 py-3 text-[12px] font-medium border ${
              testResult.ok
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : 'bg-red-400/10 border-red-400/20 text-red-400'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 bg-white/[0.04] border border-white/[0.055] text-[var(--ds-text-2)] text-sm font-medium py-2.5 rounded-xl hover:bg-white/[0.07] transition-colors"
            >
              ביטול
            </button>
            {configured && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex-shrink-0 bg-white/[0.04] border border-white/[0.055] text-[var(--ds-text-2)] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-white/[0.07] transition-colors disabled:opacity-50"
              >
                {testing ? 'בודק...' : 'בדוק חיבור'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsSettingsPage() {
  const [configs, setConfigs] = useState<Record<string, ServiceConfig>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const results = await Promise.all(
      INTEGRATIONS.map(i =>
        fetch(`/api/admin/integrations/${i.id}`)
          .then(r => r.json())
          .then((d: ServiceConfig) => [i.id, d] as const)
          .catch(() => [i.id, { service: i.id, configured: false, config: null }] as const)
      )
    )
    setConfigs(Object.fromEntries(results))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(id: string, data: Record<string, string | number | boolean>) {
    await fetch(`/api/admin/integrations/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await load()
  }

  const connectedCount = Object.values(configs).filter(c => c.configured).length
  const totalCount = INTEGRATIONS.length

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-[var(--ds-text-1)]">חיבורים ואינטגרציות</h1>
        <p className="text-[12px] text-[var(--ds-text-3)] mt-0.5">
          {loading ? 'טוען...' : `${connectedCount} מתוך ${totalCount} שירותים מחוברים`}
        </p>
      </div>

      {/* Progress bar */}
      {!loading && (
        <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[12px] font-medium text-[var(--ds-text-2)]">התקדמות הגדרה</p>
            <p className="text-[12px] font-bold text-[var(--ds-text-1)] num">{connectedCount}/{totalCount}</p>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((connectedCount / totalCount) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/[0.04] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER.map(cat => {
            const items = INTEGRATIONS.filter(i => i.category === cat)
            return (
              <div key={cat}>
                <p className="text-[10px] font-bold text-[var(--ds-text-3)] uppercase tracking-[0.12em] mb-3 px-1">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="space-y-2">
                  {items.map(def => (
                    <IntegrationCard
                      key={def.id}
                      def={def}
                      serviceConfig={configs[def.id]}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Help footer */}
      <div className="mt-8 bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4">
        <p className="text-[12px] font-semibold text-[var(--ds-text-2)] mb-1">צריך עזרה?</p>
        <p className="text-[11px] text-[var(--ds-text-3)]">
          כל השירותים מאוחסנים בצורה מאובטחת. אין צורך לגעת בקוד או בשרת.
          לאחר שמירה, לחץ "בדוק חיבור" כדי לוודא שהכל עובד.
        </p>
      </div>
    </div>
  )
}
