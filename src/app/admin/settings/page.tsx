'use client'
import { useEffect, useState } from 'react'

const TABS = [
  { id: 'store',         label: 'פרטי חנות',    icon: '🏪' },
  { id: 'faq',           label: 'שאלות נפוצות', icon: '❓' },
  { id: 'domain',        label: 'דומיין',        icon: '🌐' },
  { id: 'notifications', label: 'התראות',        icon: '🔔' },
  { id: 'team',          label: 'צוות',          icon: '👥' },
  { id: 'cloudinary',    label: 'Cloudinary',   icon: '🖼️' },
  { id: 'smtp',          label: 'אימייל SMTP',   icon: '📧' },
  { id: 'twilio',        label: 'WhatsApp',      icon: '📱' },
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
        className="w-full bg-[#0E1629] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
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
  const [domain, setDomain] = useState({ customDomain: '' })
  const [notifications, setNotifications] = useState({ newOrder: true, lowStock: true, abandonedCart: false, weeklyReport: false })
  const [team, setTeam] = useState<{ id: string; email: string; name: string; role: string; status: string; joinedAt: string }[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [globalFaqs, setGlobalFaqs] = useState<{ q: string; a: string }[]>([])
  const [faqLoading, setFaqLoading] = useState(true)
  const [faqSaving, setFaqSaving] = useState(false)
  const [faqSaved, setFaqSaved] = useState(false)

  useEffect(() => {
    const keys = ['store', 'cloudinary', 'smtp', 'twilio', 'domain', 'notifications']
    keys.forEach(key => {
      fetch(`/api/admin/settings?key=${key}`)
        .then(r => r.json())
        .then(d => {
          if (!d.settings || Object.keys(d.settings).length === 0) return
          if (key === 'store')         setStore(s => ({ ...s, ...d.settings }))
          if (key === 'cloudinary')    setCloudinary(s => ({ ...s, ...d.settings }))
          if (key === 'smtp')          setSmtp(s => ({ ...s, ...d.settings }))
          if (key === 'twilio')        setTwilio(s => ({ ...s, ...d.settings }))
          if (key === 'domain')        setDomain(s => ({ ...s, ...d.settings }))
          if (key === 'notifications') setNotifications(s => ({ ...s, ...d.settings }))
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
    <div className="p-4 md:p-6 min-h-screen bg-[#070B14]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">הגדרות</h1>
        <p className="text-sm text-gray-500 mt-0.5">פרטי החנות, תשלום, מיילים ו-WhatsApp</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#0E1629] border border-white/5 rounded-xl p-1 flex-wrap">
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
        <div className="bg-[#0E1629] border border-white/5 rounded-xl p-6 space-y-4 max-w-2xl">
          <h2 className="text-sm font-semibold text-white mb-4">פרטי החנות</h2>
          <Field label="שם החנות" value={store.storeName} onChange={v => setStore(s => ({ ...s, storeName: v }))} />
          <Field label="אימייל תמיכה" value={store.storeEmail} type="email" onChange={v => setStore(s => ({ ...s, storeEmail: v }))} />
          <Field label="טלפון" value={store.storePhone} type="tel" onChange={v => setStore(s => ({ ...s, storePhone: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="כתובת" value={store.storeAddress} onChange={v => setStore(s => ({ ...s, storeAddress: v }))} />
            <Field label="עיר" value={store.storeCity} onChange={v => setStore(s => ({ ...s, storeCity: v }))} />
          </div>
          <div className="bg-[#070B14] border border-white/5 rounded-lg px-4 py-3">
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
              השינויים מסונכרנים מיידית לאחר השמירה.
            </p>
          </div>
          <div className="bg-[#0E1629] border border-white/5 rounded-xl p-6 space-y-4">
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
                  <div key={i} className="bg-[#070B14] border border-white/5 rounded-xl p-3 space-y-2">
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
              {faqSaved && <span className="text-green-400 text-sm font-medium">✓ נשמר בהצלחה</span>}
            </div>
          </div>
        </div>
      )}

      {/* Cloudinary tab */}
      {tab === 'cloudinary' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-[#0E1629] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">Cloudinary — אחסון תמונות</h2>
              <StatusBadge set={!!cloudinary.cloudName && !!cloudinary.apiKey} />
            </div>
            <p className="text-xs text-gray-500">נדרש להעלאת תמונות מוצרים. הגדר בחשבון Cloudinary שלך ומלא כאן.</p>
            <Field label="שם החשבון" value={cloudinary.cloudName} placeholder="my-cloud-name" onChange={v => setCloudinary(s => ({ ...s, cloudName: v }))} hint='מופיע בדשבורד של Cloudinary תחת "Account Details"' />
            <Field label="מפתח גישה" value={cloudinary.apiKey} placeholder="123456789012345" onChange={v => setCloudinary(s => ({ ...s, apiKey: v }))} hint='Settings → Access Keys בדשבורד Cloudinary' />
            <Field label="סיסמת גישה" value={cloudinary.apiSecret} type="password" placeholder="••••••••••••••••••••" onChange={v => setCloudinary(s => ({ ...s, apiSecret: v }))} hint='ליד המפתח בדשבורד Cloudinary' />
            <SaveBar saving={saving} saved={saved} onSave={() => save('cloudinary', cloudinary)} />
          </div>
        </div>
      )}

      {/* SMTP tab */}
      {tab === 'smtp' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-[#0E1629] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">מיילים אוטומטיים</h2>
              <StatusBadge set={!!smtp.smtpUser && !!smtp.smtpPassword} />
            </div>
            <p className="text-xs text-gray-500">נדרש לשליחת אישורי הזמנה ועדכונים ללקוחות. מומלץ Gmail.</p>
            <Field label="כתובת מייל שולחת" value={smtp.smtpUser} type="email" placeholder="orders@yourstore.com" onChange={v => setSmtp(s => ({ ...s, smtpUser: v }))} hint='הכתובת ממנה יישלחו המיילים ללקוחות' />
            <Field label="סיסמת אפליקציה" value={smtp.smtpPassword} type="password" placeholder="xxxx xxxx xxxx xxxx" onChange={v => setSmtp(s => ({ ...s, smtpPassword: v }))} hint='ב-Gmail: הגדרות → אבטחה → סיסמאות אפליקציה' />
            <SaveBar saving={saving} saved={saved} onSave={() => save('smtp', smtp)} />
          </div>
          <div className="bg-[#0E1629] border border-white/5 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-white">איך מקבלים סיסמת Gmail:</p>
            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
              <li>כנס לחשבון Google שלך</li>
              <li>הגדרות → אבטחה → הפעל אימות דו-שלבי</li>
              <li>חפש &quot;סיסמאות אפליקציה&quot;</li>
              <li>צור סיסמה חדשה עבור &quot;Mail&quot;</li>
              <li>העתק את 16 התווים והדבק למעלה</li>
            </ol>
          </div>
        </div>
      )}

      {/* Twilio tab */}
      {tab === 'twilio' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-[#0E1629] border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white">WhatsApp — הודעות אוטומטיות</h2>
              <StatusBadge set={!!twilio.accountSid && !!twilio.authToken} />
            </div>
            <p className="text-xs text-gray-500">שליחת הודעות WhatsApp ללקוחות. פתח חשבון Twilio ב-twilio.com ואפשר WhatsApp Business.</p>
            <Field label="מזהה חשבון Twilio" value={twilio.accountSid} placeholder="AC..." onChange={v => setTwilio(s => ({ ...s, accountSid: v }))} hint='מופיע בדף הראשי של חשבון Twilio' />
            <Field label="קוד גישה" value={twilio.authToken} type="password" placeholder="••••••••••••••••••••••••••••••••" onChange={v => setTwilio(s => ({ ...s, authToken: v }))} hint='ליד מזהה החשבון בדשבורד Twilio' />
            <Field label="מספר WhatsApp שולח" value={twilio.whatsappFrom} placeholder="+14155238886" onChange={v => setTwilio(s => ({ ...s, whatsappFrom: v }))} hint='מספר WhatsApp Business מאומת ב-Twilio' />
            <SaveBar saving={saving} saved={saved} onSave={() => save('twilio', twilio)} />
          </div>
        </div>
      )}
    </div>
  )
}
