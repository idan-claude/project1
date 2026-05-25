'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Automation {
  _id: string
  name: string
  type: string
  channel: string
  status: string
  stats: { sent: number; converted: number }
}

const TEMPLATES = [
  { id: 'order_confirm', name: 'אישור הזמנה', text: 'שלום {name}! 🎉 הזמנתך #{orderNumber} התקבלה בהצלחה. FindCard PRO שלך בדרך אליך!' },
  { id: 'abandoned_cart', name: 'תזכורת עגלה נטושה', text: 'היי {name}! שכחת משהו בעגלה 🛒 FindCard PRO עדיין מחכה לך. מלאי מוגבל!' },
  { id: 'shipping', name: 'עדכון משלוח', text: 'שלום {name}! 📦 הזמנתך #{orderNumber} יצאה לדרך! מספר מעקב: {tracking}.' },
  { id: 'review_request', name: 'בקשת ביקורת', text: 'שלום {name}! 😊 קיבלת את הFindCard? נשמח לדעת מה דעתך!' },
]

const TYPE_LABELS: Record<string, string> = {
  order_confirm: 'אישור הזמנה',
  abandoned_cart: 'עגלה נטושה',
  welcome_flow: 'קבלת פנים',
  review_request: 'בקשת ביקורת',
  shipping_update: 'עדכון משלוח',
  winback: 'החזרת לקוח',
}

export default function WhatsAppPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [selected, setSelected] = useState(TEMPLATES[0])
  const [customText, setCustomText] = useState(TEMPLATES[0].text)
  const [tab, setTab] = useState<'automations' | 'manual'>('automations')

  useEffect(() => {
    fetch('/api/admin/automations')
      .then(r => r.json())
      .then(d => {
        const wa = (d.automations ?? []).filter((a: Automation) => a.channel === 'whatsapp' || a.channel === 'both')
        setAutomations(wa)
      })
      .catch(() => {})
  }, [])

  async function toggleAutomation(id: string, current: string) {
    await fetch(`/api/admin/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: current === 'active' ? 'paused' : 'active' }),
    })
    setAutomations(prev => prev.map(a => a._id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a))
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">וואטסאפ</h1>
          <p className="text-sm text-gray-500">אוטומציות ושליחה ידנית ל-WhatsApp</p>
        </div>
        <Link href="/admin/settings?tab=twilio"
          className="flex items-center gap-2 bg-[#0E1525] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
          <span>⚙️</span>
          <span>הגדרת Twilio</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#0E1525] border border-white/5 rounded-xl p-1 w-fit">
        {[{ id: 'automations', label: 'אוטומציות' }, { id: 'manual', label: 'שליחה ידנית' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'automations' && (
        <div className="space-y-4">
          {automations.length === 0 ? (
            <div className="bg-[#0E1525] border border-white/5 rounded-xl p-8 text-center">
              <p className="text-3xl mb-3">📱</p>
              <p className="text-white font-semibold mb-1">אין אוטומציות WhatsApp</p>
              <p className="text-sm text-gray-500 mb-4">צור אוטומציות עם ערוץ WhatsApp בדף האוטומציות</p>
              <Link href="/admin/automations"
                className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                נהל אוטומציות ←
              </Link>
            </div>
          ) : (
            automations.map(a => (
              <div key={a._id} className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm">{a.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[a.type] ?? a.type} · {a.stats.sent} נשלחו</p>
                </div>
                <button
                  onClick={() => toggleAutomation(a._id, a.status)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${a.status === 'active' ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${a.status === 'active' ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))
          )}
          <Link href="/admin/automations"
            className="block w-full text-center bg-[#0E1525] border border-white/5 rounded-xl py-3 text-sm text-gray-500 hover:text-white hover:border-white/10 transition-colors">
            + הוסף אוטומציה חדשה
          </Link>
        </div>
      )}

      {tab === 'manual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4 text-sm">תבניות הודעה</h2>
            <div className="space-y-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setSelected(t); setCustomText(t.text) }}
                  className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${selected.id === t.id ? 'bg-blue-600 text-white' : 'bg-[#080C16] text-gray-300 hover:bg-white/5'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3 text-sm">עריכת הודעה: {selected.name}</h2>
            <textarea value={customText} onChange={e => setCustomText(e.target.value)} rows={5}
              className="w-full bg-[#080C16] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none mb-3" />
            <p className="text-xs text-gray-600 mb-4">משתנים: {'{name}'}, {'{orderNumber}'}, {'{tracking}'}</p>

            <div className="bg-[#1B2638] rounded-xl p-4 mb-4">
              <div className="bg-[#DCF8C6] rounded-xl rounded-tl-sm px-4 py-3 max-w-xs mr-auto shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {customText.replace(/{name}/g, 'דוגמה').replace(/{orderNumber}/g, 'ORD-042').replace(/{tracking}/g, 'IL123456')}
                </p>
                <p className="text-xs text-gray-500 text-left mt-1">14:32 ✓✓</p>
              </div>
            </div>

            <a href={`https://wa.me/?text=${encodeURIComponent(customText.replace(/{name}/g, 'לקוח').replace(/{orderNumber}/g, 'ORD-001').replace(/{tracking}/g, 'IL123456'))}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20BD5A] transition-colors flex items-center justify-center gap-2 text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.604L0 24l6.545-1.371A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.683-.506-5.215-1.385l-.374-.22-3.882.813.826-3.79-.241-.389A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              פתח בוואטסאפ
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
