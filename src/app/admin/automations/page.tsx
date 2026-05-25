'use client'
import { useEffect, useState } from 'react'

type AutomationType = 'abandoned_cart' | 'welcome_flow' | 'order_confirm' | 'review_request' | 'winback' | 'reorder_reminder' | 'low_stock_alert' | 'shipping_update'
type Channel = 'email' | 'whatsapp' | 'both'

interface Automation {
  _id: string
  name: string
  type: AutomationType
  channel: Channel
  status: 'active' | 'paused'
  triggerConfig: { delayMinutes: number }
  stats: { sent: number; opened: number; clicked: number; converted: number; revenue: number }
}

const TYPE_META: Record<AutomationType, { icon: string; label: string; desc: string; defaultDelay: number; defaultName: string }> = {
  abandoned_cart:   { icon: '🛒', label: 'עגלה נטושה', desc: 'לקוח הוסיף לסל ולא השלים תשלום', defaultDelay: 60, defaultName: 'עגלה נטושה — תזכורת' },
  welcome_flow:     { icon: '👋', label: 'ברוך הבא', desc: 'לאחר רכישה ראשונה', defaultDelay: 5, defaultName: 'ברוך הבא ל-FindCard' },
  order_confirm:    { icon: '✅', label: 'אישור הזמנה', desc: 'אחרי השלמת תשלום מוצלח', defaultDelay: 0, defaultName: 'אישור הזמנה' },
  review_request:   { icon: '⭐', label: 'בקשת ביקורת', desc: '7 ימים אחרי מסירת המוצר', defaultDelay: 7 * 24 * 60, defaultName: 'בקשת ביקורת' },
  winback:          { icon: '💌', label: 'החזרת לקוח', desc: 'לקוחות שלא קנו 30+ יום', defaultDelay: 30 * 24 * 60, defaultName: 'חזור אלינו — הצעה מיוחדת' },
  reorder_reminder: { icon: '🔄', label: 'תזכורת הזמנה חוזרת', desc: '60 יום אחרי רכישה', defaultDelay: 60 * 24 * 60, defaultName: 'הגיע הזמן להזמין שוב' },
  low_stock_alert:  { icon: '⚠️', label: 'התראת מלאי נמוך', desc: 'שולח לך כמנהל כשמלאי נמוך', defaultDelay: 0, defaultName: 'התראת מלאי נמוך' },
  shipping_update:  { icon: '📦', label: 'עדכון משלוח', desc: 'כשסטטוס ההזמנה משתנה', defaultDelay: 0, defaultName: 'עדכון סטטוס משלוח' },
}

const CHANNEL_LABEL: Record<Channel, string> = { email: '✉️ מייל', whatsapp: '💬 WhatsApp', both: '✉️ + 💬 שניהם' }

const DEFAULT_AUTOMATIONS: Omit<Automation, '_id'>[] = [
  { name: 'אישור הזמנה', type: 'order_confirm', channel: 'email', status: 'paused', triggerConfig: { delayMinutes: 0 }, stats: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 } },
  { name: 'עגלה נטושה — תזכורת', type: 'abandoned_cart', channel: 'email', status: 'paused', triggerConfig: { delayMinutes: 60 }, stats: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 } },
  { name: 'בקשת ביקורת', type: 'review_request', channel: 'email', status: 'paused', triggerConfig: { delayMinutes: 7 * 24 * 60 }, stats: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 } },
  { name: 'עדכון משלוח', type: 'shipping_update', channel: 'whatsapp', status: 'paused', triggerConfig: { delayMinutes: 0 }, stats: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 } },
]

function delayLabel(minutes: number) {
  if (minutes === 0) return 'מיידי'
  if (minutes < 60) return `${minutes} דקות`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} שעות`
  return `${Math.round(minutes / (24 * 60))} ימים`
}

function rateLabel(num: number, denom: number) {
  if (denom === 0) return '—'
  return `${Math.round((num / denom) * 100)}%`
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newType, setNewType] = useState<AutomationType>('abandoned_cart')
  const [newChannel, setNewChannel] = useState<Channel>('email')
  const [credWarning, setCredWarning] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/automations')
      const d = await r.json()
      setAutomations(d.automations || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function seedDefaults() {
    setSeeding(true)
    for (const a of DEFAULT_AUTOMATIONS) {
      await fetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      })
    }
    await load()
    setSeeding(false)
  }

  async function toggleStatus(id: string, current: 'active' | 'paused') {
    const newStatus = current === 'active' ? 'paused' : 'active'
    if (newStatus === 'active') setCredWarning(true)
    await fetch(`/api/admin/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק אוטומציה זו?')) return
    await fetch(`/api/admin/automations/${id}`, { method: 'DELETE' })
    await load()
  }

  async function createNew() {
    const meta = TYPE_META[newType]
    await fetch('/api/admin/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: meta.defaultName,
        type: newType,
        channel: newChannel,
        status: 'paused',
        triggerConfig: { delayMinutes: meta.defaultDelay },
        stats: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 },
      }),
    })
    setShowNew(false)
    await load()
  }

  const totalSent = automations.reduce((s, a) => s + a.stats.sent, 0)
  const totalConverted = automations.reduce((s, a) => s + a.stats.converted, 0)
  const totalRevenue = automations.reduce((s, a) => s + a.stats.revenue, 0)
  const activeCount = automations.filter(a => a.status === 'active').length

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">אוטומציות</h1>
          <p className="text-sm text-gray-500 mt-0.5">שלח מיילים ו-WhatsApp בצורה אוטומטית לפי פעולות לקוח</p>
        </div>
        <div className="flex gap-2 sm:mr-auto">
          {automations.length === 0 && !loading && (
            <button onClick={seedDefaults} disabled={seeding}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
              {seeding ? '⏳ יוצר...' : '🔧 הוסף ברירות מחדל'}
            </button>
          )}
          <button onClick={() => setShowNew(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            + אוטומציה חדשה
          </button>
        </div>
      </div>

      {/* Credentials warning */}
      {credWarning && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">פרטי חיבור חסרים</p>
            <p className="text-xs text-gray-500 mt-0.5">לאוטומציות פעילות נדרש: SMTP_USER + SMTP_PASSWORD (מייל) ו-TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN (WhatsApp). הגדר ב-Vercel → Environment Variables.</p>
          </div>
          <button onClick={() => setCredWarning(false)} className="text-gray-600 hover:text-gray-400 text-sm">✕</button>
        </div>
      )}

      {/* Stats row */}
      {automations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'פעילות', value: `${activeCount}/${automations.length}`, color: activeCount > 0 ? 'text-emerald-400' : 'text-gray-500' },
            { label: 'נשלחו', value: totalSent.toLocaleString('he-IL'), color: 'text-white' },
            { label: 'המירו', value: totalConverted.toString(), color: 'text-blue-400' },
            { label: 'הכנסה', value: totalRevenue > 0 ? `₪${(totalRevenue / 100).toFixed(0)}` : '₪0', color: 'text-emerald-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
              <p className="text-xs text-gray-600">{kpi.label}</p>
              <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#0E1525] rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && automations.length === 0 && (
        <div className="text-center py-16 bg-[#0E1525] border border-white/5 rounded-2xl">
          <p className="text-4xl mb-3">⚡</p>
          <p className="text-white font-semibold mb-1">אין אוטומציות עדיין</p>
          <p className="text-xs text-gray-600 mb-5">צור אוטומציות שישלחו מיילים ו-WhatsApp ללקוחות אוטומטית</p>
          <button onClick={seedDefaults} disabled={seeding}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            {seeding ? '⏳ יוצר...' : 'הוסף ברירות מחדל ←'}
          </button>
        </div>
      )}

      {/* Automation list */}
      {!loading && automations.length > 0 && (
        <div className="space-y-2">
          {automations.map(auto => {
            const meta = TYPE_META[auto.type]
            const isEdit = editId === auto._id
            return (
              <div key={auto._id}
                className={`bg-[#0E1525] border rounded-2xl transition-colors ${auto.status === 'active' ? 'border-blue-500/25' : 'border-white/5'}`}>
                <div className="p-4 flex items-center gap-4">
                  <span className="text-xl flex-shrink-0">{meta?.icon || '⚡'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{auto.name}</p>
                      <span className="text-[10px] text-gray-600 border border-white/10 px-2 py-0.5 rounded-full">{meta?.label}</span>
                      <span className="text-[10px] text-gray-600 border border-white/10 px-2 py-0.5 rounded-full">{CHANNEL_LABEL[auto.channel]}</span>
                      <span className="text-[10px] text-gray-600">⏱ {delayLabel(auto.triggerConfig.delayMinutes)}</span>
                    </div>
                    {auto.stats.sent > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {auto.stats.sent} נשלחו · {rateLabel(auto.stats.opened, auto.stats.sent)} פתיחה · {rateLabel(auto.stats.clicked, auto.stats.sent)} קליק · {rateLabel(auto.stats.converted, auto.stats.sent)} המרה
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditId(isEdit ? null : auto._id)}
                      className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {isEdit ? 'סגור' : 'ערוך'}
                    </button>
                    <button onClick={() => handleDelete(auto._id)}
                      className="text-xs text-red-500/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/5 transition-colors">✕</button>
                    {/* Toggle */}
                    <button
                      onClick={() => toggleStatus(auto._id, auto.status)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${auto.status === 'active' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${auto.status === 'active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                {/* Edit panel */}
                {isEdit && (
                  <EditPanel automation={auto} onSave={async (patch) => {
                    await fetch(`/api/admin/automations/${auto._id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(patch),
                    })
                    setEditId(null)
                    await load()
                  }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New automation modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="bg-[#0E1525] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-base mb-4">אוטומציה חדשה</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">סוג האוטומציה</label>
                <select
                  className="w-full bg-[#080C16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60"
                  value={newType}
                  onChange={e => setNewType(e.target.value as AutomationType)}
                >
                  {(Object.entries(TYPE_META) as Array<[AutomationType, typeof TYPE_META[AutomationType]]>).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label} — {v.desc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">ערוץ שליחה</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['email', 'whatsapp', 'both'] as Channel[]).map(ch => (
                    <button key={ch} type="button" onClick={() => setNewChannel(ch)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors ${newChannel === ch ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-white/10 text-gray-500 hover:text-gray-300'}`}>
                      {CHANNEL_LABEL[ch]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={createNew}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                צור אוטומציה
              </button>
              <button onClick={() => setShowNew(false)}
                className="bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-2.5 rounded-xl text-sm transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditPanel({ automation, onSave }: {
  automation: Automation
  onSave: (patch: Partial<Automation>) => Promise<void>
}) {
  const [name, setName] = useState(automation.name)
  const [delay, setDelay] = useState(automation.triggerConfig.delayMinutes)
  const [channel, setChannel] = useState<Channel>(automation.channel)
  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full bg-[#080C16] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60'

  async function save() {
    setSaving(true)
    await onSave({ name, channel, triggerConfig: { delayMinutes: delay } })
    setSaving(false)
  }

  return (
    <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500 block mb-1">שם האוטומציה</label>
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">עיכוב (דקות)</label>
          <input className={inputCls} type="number" min="0" value={delay} onChange={e => setDelay(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">ערוץ</label>
        <div className="flex gap-2">
          {(['email', 'whatsapp', 'both'] as Channel[]).map(ch => (
            <button key={ch} type="button" onClick={() => setChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${channel === ch ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-white/10 text-gray-600'}`}>
              {ch === 'email' ? '✉️ מייל' : ch === 'whatsapp' ? '💬 WhatsApp' : '✉️+💬 שניהם'}
            </button>
          ))}
        </div>
      </div>
      <button onClick={save} disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
        {saving ? '⏳ שומר...' : '✓ שמור שינויים'}
      </button>
    </div>
  )
}
