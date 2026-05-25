'use client'
import { useEffect, useState } from 'react'

interface Campaign {
  _id: string
  name: string
  subject: string
  bodyHtml: string
  bodyText: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduledAt: string | null
  targetSegment: string
  targetEmails: string[]
  stats: { total: number; sent: number; opened: number; clicked: number; bounced: number }
  createdAt: string
}

const SEGMENT_LABELS: Record<string, string> = {
  all: 'כל הלקוחות',
  paid: 'לקוחות ששילמו',
  unpaid: 'עגלות נטושות',
  abandoned: 'לקוחות שנטשו',
  custom: 'רשימה ידנית',
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'text-gray-400 border-gray-400/30',
  scheduled: 'text-blue-400 border-blue-400/30',
  sending: 'text-yellow-400 border-yellow-400/30',
  sent: 'text-emerald-400 border-emerald-400/30',
  cancelled: 'text-red-400 border-red-400/30',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'טיוטה',
  scheduled: 'מתוזמן',
  sending: 'שולח...',
  sent: 'נשלח',
  cancelled: 'בוטל',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [sendResult, setSendResult] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  const [form, setForm] = useState({
    name: '',
    subject: '',
    bodyText: '',
    bodyHtml: '',
    targetSegment: 'all',
    targetEmails: '',
    scheduledAt: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/campaigns')
    const d = await r.json()
    setCampaigns(d.campaigns ?? [])
    setLoading(false)
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const body = {
      name: form.name,
      subject: form.subject,
      bodyText: form.bodyText,
      bodyHtml: form.bodyHtml || `<p>${form.bodyText}</p>`,
      targetSegment: form.targetSegment,
      targetEmails: form.targetSegment === 'custom' ? form.targetEmails.split('\n').map(e => e.trim()).filter(Boolean) : [],
      scheduledAt: form.scheduledAt || null,
      status: form.scheduledAt ? 'scheduled' : 'draft',
    }
    await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowModal(false)
    setForm({ name: '', subject: '', bodyText: '', bodyHtml: '', targetSegment: 'all', targetEmails: '', scheduledAt: '' })
    load()
  }

  async function send(id: string) {
    if (!confirm('שלח קמפיין עכשיו לכל הנמענים?')) return
    setSending(id)
    const r = await fetch(`/api/admin/campaigns/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send' }),
    })
    const d = await r.json()
    setSending(null)
    setSendResult({ id, msg: d.error || `נשלח ל-${d.sent} נמענים`, ok: r.ok })
    setTimeout(() => setSendResult(null), 4000)
    load()
  }

  async function deleteCampaign(id: string) {
    if (!confirm('למחוק קמפיין זה?')) return
    await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">קמפיינים</h1>
          <p className="text-sm text-gray-500 mt-0.5">שליחת מיילים ושיווק ישיר ללקוחות</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          + קמפיין חדש
        </button>
      </div>

      {sendResult && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${sendResult.ok ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-400/20' : 'bg-red-900/30 text-red-400 border border-red-400/20'}`}>
          {sendResult.ok ? '✓' : '✗'} {sendResult.msg}
        </div>
      )}

      {/* Stats row */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'סה"כ קמפיינים', value: campaigns.length },
            { label: 'נשלחו', value: campaigns.filter(c => c.status === 'sent').length },
            { label: 'מיילים יצאו', value: campaigns.reduce((a, c) => a + c.stats.sent, 0) },
            { label: 'בוטלו/טיוטות', value: campaigns.filter(c => c.status === 'draft' || c.status === 'cancelled').length },
          ].map(s => (
            <div key={s.label} className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
              <p className="text-2xl font-black text-white">{s.value.toLocaleString('he-IL')}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-600 text-sm">טוען...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📧</p>
          <p className="text-white font-semibold mb-1">אין קמפיינים עדיין</p>
          <p className="text-sm text-gray-500 mb-5">צור קמפיין מייל ושלח ישירות ללקוחות שלך</p>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
            צור קמפיין ראשון
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const openRate = c.stats.sent > 0 ? Math.round((c.stats.opened / c.stats.sent) * 100) : 0
            const clickRate = c.stats.sent > 0 ? Math.round((c.stats.clicked / c.stats.sent) * 100) : 0
            return (
              <div key={c._id} className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{c.name}</p>
                      <span className={`text-[10px] border px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">נושא: {c.subject}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{SEGMENT_LABELS[c.targetSegment]} · {c.targetEmails.length} נמענים</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.status === 'draft' && (
                      <button
                        onClick={() => send(c._id)}
                        disabled={sending === c._id}
                        className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        {sending === c._id ? 'שולח...' : 'שלח עכשיו'}
                      </button>
                    )}
                    <button onClick={() => deleteCampaign(c._id)} className="text-xs text-red-500 hover:text-red-400 px-2 py-1.5 transition-colors">מחק</button>
                  </div>
                </div>
                {c.status === 'sent' && (
                  <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-white/5">
                    <span>✉️ {c.stats.sent} נשלחו</span>
                    <span>👁️ {openRate}% פתחו</span>
                    <span>🖱️ {clickRate}% לחצו</span>
                    {c.stats.bounced > 0 && <span className="text-red-500">⚠️ {c.stats.bounced} נדחו</span>}
                  </div>
                )}
                {c.scheduledAt && c.status === 'scheduled' && (
                  <p className="text-xs text-blue-400 pt-2 border-t border-white/5">
                    מתוזמן ל: {new Date(c.scheduledAt).toLocaleString('he-IL')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0E1525] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">קמפיין חדש</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={create} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">שם הקמפיין</label>
                <input required value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                  className="w-full bg-[#080C16] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder='לדוג׳: מבצע סוף שבוע — 20% הנחה' />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">נושא המייל</label>
                <input required value={form.subject} onChange={e => setForm(s => ({ ...s, subject: e.target.value }))}
                  className="w-full bg-[#080C16] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="🎉 20% הנחה — סוף שבוע בלבד!" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">קהל יעד</label>
                <select value={form.targetSegment} onChange={e => setForm(s => ({ ...s, targetSegment: e.target.value }))}
                  className="w-full bg-[#080C16] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                  {Object.entries(SEGMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {form.targetSegment === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">כתובות מייל (שורה אחת לכל כתובת)</label>
                  <textarea value={form.targetEmails} onChange={e => setForm(s => ({ ...s, targetEmails: e.target.value }))}
                    rows={4} className="w-full bg-[#080C16] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="email1@example.com&#10;email2@example.com" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">תוכן המייל</label>
                <textarea required value={form.bodyText} onChange={e => setForm(s => ({ ...s, bodyText: e.target.value }))}
                  rows={6} className="w-full bg-[#080C16] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="שלום,&#10;&#10;רצינו לעדכן אותך על מבצע מיוחד..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">תזמון (ריק = טיוטה)</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(s => ({ ...s, scheduledAt: e.target.value }))}
                  className="w-full bg-[#080C16] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">
                  {form.scheduledAt ? 'תזמן קמפיין' : 'שמור כטיוטה'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm py-2.5 rounded-lg transition-colors">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
