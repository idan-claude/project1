'use client'
import { useEffect, useState } from 'react'

const TABS = [
  { id: 'store', label: 'פרטי חנות', icon: '🏪' },
  { id: 'faq', label: 'שאלות נפוצות', icon: '❓' },
  { id: 'cloudinary', label: 'Cloudinary', icon: '🖼️' },
  { id: 'smtp', label: 'אימייל SMTP', icon: '📧' },
  { id: 'twilio', label: 'Twilio WhatsApp', icon: '📱' },
]

function Field({ label, value, onChange, type = 'text', placeholder = '', hint = '' }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0E1525] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
      />
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-2 border-t border-white/5 mt-6">
      <button
        onClick={onSave}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        {saving ? 'שומר...' : 'שמור הגדרות'}
      </button>
      {saved && <span className="text-green-400 text-sm font-medium">✓ נשמר בהצלחה</span>}
    </div>
  )
}

function StatusBadge({ set }: { set: boolean }) {
  return (
    <span className={`text-[10px] border px-2 py-0.5 rounded-full ${set ? 'text-emerald-400 border-emerald-400/30' : 'text-amber-400 border-amber-400/30'}`}>
      {set ? 'מוגדר ✓' : 'חסר'}
    </span>
  )
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState('store')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [store, setStore] = useState({ storeName: 'FindCard', storeEmail: 'findcardsupport@gmail.com', storePhone: '', storeAddress: '', storeCity: '' })
  const [cloudinary, setCloudinary] = useState({ cloudName: '', apiKey: '', apiSecret: '' })
  const [smtp, setSmtp] = useState({ smtpUser: '', smtpPassword: '' })
  const [twilio, setTwilio] = useState({ accountSid: '', authToken: '', whatsappFrom: '' })
  const [globalFaqs, setGlobalFaqs] = useState<{ q: string; a: string }[]>([])
  const [faqLoading, setFaqLoading] = useState(true)
  const [faqSaving, setFaqSaving] = useState(false)
  const [faqSaved, setFaqSaved] = useState(false)

  useEffect(() => {
    const keys = ['store', 'cloudinary', 'smtp', 'twilio']
    keys.forEach(key => {
      fetch(`/api/admin/settings?key=${key}`)
        .then(r => r.json())
        .then(d => {
          if (!d.settings || Object.keys(d.settings).length === 0) return
          if (key === 'store') setStore(s => ({ ...s, ...d.settings }))
          if (key === 'cloudinary') setCloudinary(s => ({ ...s, ...d.settings }))
          if (key === 'smtp') setSmtp(s => ({ ...s, ...d.settings }))
          if (key === 'twilio') setTwilio(s => ({ ...s, ...d.settings }))
        })
        .catch(() => {})
    })
    // Load global FAQs
    fetch('/api/admin/global-faq')
      .then(r => r.json())
      .then(d => { if (d.faqs) setGlobalFaqs(d.faqs) })
      .catch(() => {})
      .finally(() => setFaqLoading(false))
  }, [])

  async function saveGlobalFaqs() {
    setFaqSaving(true)
    try {
      const res = await fetch('/api/admin/global-faq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqs: globalFaqs }),
      })
      const d = await res.json()
      if (d.faqs) setGlobalFaqs(d.faqs)
      setFaqSaved(true)
      setTimeout(() => setFaqSaved(false), 2500)
    } finally {
      setFaqSaving(false)
    }
  }

  async function save(key: string, value: object) {
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">הגדרות</h1>
        <p className="text-sm text-gray-500 mt-0.5">פרטי החנות, תשלום, מיילים ו-WhatsApp</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#0E1525] border border-white/5 rounded-xl p-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Store tab */}
      {tab === 'store' && (
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-6 space-y-4 max-w-2xl">
          <h2 className="text-sm font-semibold text-white mb-4">פרטי החנות</h2>
          <Field label="שם החנות" value={store.storeName} onChange={v => setStore(s => ({ ...s, storeName: v }))} />
          <Field label="אימייל תמיכה" value={store.storeEmail} type="email" onChange={v => setStore(s => ({ ...s, storeEmail: v }))} />
          <Field label="טלפון" value={store.storePhone} type="tel" onChange={v => setStore(s => ({ ...s, storePhone: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="כתובת" value={store.storeAddress} onChange={v => setStore(s => ({ ...s, storeAddress: v }))} />
            <Field label="עיר" value={store.storeCity} onChange={v => setStore(s => ({ ...s, storeCity: v }))} />
          </div>
          <div className="bg-[#080C16] border border-white/5 rounded-lg px-4 py-3">
            <p className="text-xs text-green-400 font-medium">✓ משלוח חינם על כל ההזמנות — תמיד</p>
          </div>
          <SaveBar saving={saving} saved={saved} onSave={() => save('store', store)} />
        </div>
      )}

      {/* Global FAQ tab */}
      {tab === 'faq' && (
        <div className="max-w-2xl">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-blue-400 mb-1">שאלות נפוצות גלובליות</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              שאלות אלה מוצגות ב<strong className="text-white">דף המוצר</strong> ו<strong className="text-white">בדף הבית</strong>.
              אם למוצר ספציפי יש שאלות משלו — הן יגברו על השאלות הגלובליות.
              השינויים נשמרים ב-MongoDB ומסונכרנים מיידית ללא deploy.
            </p>
          </div>
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">שאלות נפוצות ({globalFaqs.length})</h2>
              <button
                onClick={() => setGlobalFaqs(f => [...f, { q: '', a: '' }])}
                className="text-xs text-blue-400 hover:text-blue-300 border border-blue-400/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                + הוסף שאלה
              </button>
            </div>
            {faqLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : globalFaqs.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-6">אין שאלות עדיין — לחץ "+ הוסף שאלה"</p>
            ) : (
              <div className="space-y-3">
                {globalFaqs.map((faq, i) => (
                  <div key={i} className="bg-[#080C16] border border-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-4 flex-shrink-0">{i + 1}.</span>
                      <input
                        value={faq.q}
                        onChange={e => setGlobalFaqs(f => f.map((x, j) => j === i ? { ...x, q: e.target.value } : x))}
                        placeholder="שאלה..."
                        className="flex-1 bg-transparent border-b border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 pb-1"
                      />
                      <button
                        onClick={() => setGlobalFaqs(f => f.filter((_, j) => j !== i))}
                        className="text-xs text-red-500 hover:text-red-400 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      value={faq.a}
                      onChange={e => setGlobalFaqs(f => f.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                      placeholder="תשובה..."
                      rows={2}
                      className="w-full bg-transparent text-xs text-gray-400 placeholder-gray-600 focus:outline-none resize-none leading-relaxed pr-6"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
              <button
                onClick={saveGlobalFaqs}
                disabled={faqSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {faqSaving ? 'שומר...' : 'שמור שאלות'}
              </button>
              {faqSaved && <span className="text-green-400 text-sm font-medium">✓ נשמר — מסונכרן מיידית</span>}
            </div>
          </div>
        </div>
      )}

      {/* Cloudinary tab */}
      {tab === 'cloudinary' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Cloudinary — אחסון תמונות</h2>
              <StatusBadge set={!!cloudinary.cloudName && !!cloudinary.apiKey} />
            </div>
            <p className="text-xs text-gray-500">נדרש להעלאת תמונות מוצרים. הגדר בחשבון Cloudinary שלך ומלא כאן.</p>
            <Field label="Cloud Name" value={cloudinary.cloudName} placeholder="my-cloud-name" onChange={v => setCloudinary(s => ({ ...s, cloudName: v }))} hint="מופיע בדשבורד של Cloudinary" />
            <Field label="API Key" value={cloudinary.apiKey} placeholder="123456789012345" onChange={v => setCloudinary(s => ({ ...s, apiKey: v }))} />
            <Field label="API Secret" value={cloudinary.apiSecret} type="password" placeholder="••••••••••••••••••••" onChange={v => setCloudinary(s => ({ ...s, apiSecret: v }))} hint="Settings → Access Keys בדשבורד Cloudinary" />
            <SaveBar saving={saving} saved={saved} onSave={() => save('cloudinary', cloudinary)} />
          </div>
          <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ חשוב — להפעלה בסביבת הפרודקשן:</p>
            <p className="text-xs text-amber-400/70">הוסף גם לסביבת Vercel: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET</p>
          </div>
        </div>
      )}

      {/* SMTP tab */}
      {tab === 'smtp' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">SMTP — שליחת מיילים</h2>
              <StatusBadge set={!!smtp.smtpUser && !!smtp.smtpPassword} />
            </div>
            <p className="text-xs text-gray-500">נדרש לשליחת אימייל אישור הזמנה ואוטומציות. מומלץ Gmail עם App Password.</p>
            <Field label="כתובת אימייל (SMTP User)" value={smtp.smtpUser} type="email" placeholder="findcardsupport@gmail.com" onChange={v => setSmtp(s => ({ ...s, smtpUser: v }))} />
            <Field label="סיסמת אפליקציה (App Password)" value={smtp.smtpPassword} type="password" placeholder="xxxx xxxx xxxx xxxx" onChange={v => setSmtp(s => ({ ...s, smtpPassword: v }))} hint='ב-Gmail: הגדרות → אבטחה → אימות דו-שלבי → סיסמאות אפליקציה → "Mail"' />
            <SaveBar saving={saving} saved={saved} onSave={() => save('smtp', smtp)} />
          </div>
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-white">הוראות Gmail App Password:</p>
            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
              <li>כנס לחשבון Google שלך</li>
              <li>הגדרות → אבטחה → הפעל אימות דו-שלבי</li>
              <li>חפש &quot;App Passwords&quot; (סיסמאות אפליקציה)</li>
              <li>צור סיסמה חדשה לסוג &quot;Mail&quot;</li>
              <li>העתק את 16 התווים והדבק למעלה</li>
            </ol>
          </div>
          <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ להפעלה בסביבת Vercel:</p>
            <p className="text-xs text-amber-400/70">הוסף: SMTP_USER, SMTP_PASSWORD לסביבת Vercel</p>
          </div>
        </div>
      )}

      {/* Twilio tab */}
      {tab === 'twilio' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Twilio — WhatsApp ו-SMS</h2>
              <StatusBadge set={!!twilio.accountSid && !!twilio.authToken} />
            </div>
            <p className="text-xs text-gray-500">נדרש לאוטומציות WhatsApp. פתח חשבון Twilio ב-twilio.com ואפשר WhatsApp Business.</p>
            <Field label="Account SID" value={twilio.accountSid} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" onChange={v => setTwilio(s => ({ ...s, accountSid: v }))} hint='מופיע בדף הראשי של קונסול Twilio' />
            <Field label="Auth Token" value={twilio.authToken} type="password" placeholder="••••••••••••••••••••••••••••••••" onChange={v => setTwilio(s => ({ ...s, authToken: v }))} />
            <Field label="WhatsApp From (מספר שולח)" value={twilio.whatsappFrom} placeholder="whatsapp:+14155238886" onChange={v => setTwilio(s => ({ ...s, whatsappFrom: v }))} hint='מספר Twilio WhatsApp Sandbox או Business מאומת' />
            <SaveBar saving={saving} saved={saved} onSave={() => save('twilio', twilio)} />
          </div>
          <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ להפעלה בסביבת Vercel:</p>
            <p className="text-xs text-amber-400/70">הוסף: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM לסביבת Vercel</p>
          </div>
        </div>
      )}
    </div>
  )
}
