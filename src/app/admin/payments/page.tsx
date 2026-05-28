'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface Payment {
  _id: string
  orderNumber: string
  customer: string
  amount: number
  method: string
  status: string
  createdAt: string
}

interface ProviderConfig {
  providerId: string
  name: string
  description: string
  logoEmoji: string
  countryCode: string
  docs: string
  enabled: boolean
  priority: number
  isConfigured: boolean
}

interface HealthResult {
  id: string
  name: string
  ok: boolean
  latency: number
  message?: string
}

type Tab = 'transactions' | 'providers' | 'settings'

const STATUS_CLR: Record<string, string> = {
  paid:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  pending:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  failed:   'bg-red-500/15 text-red-400 border-red-500/20',
  refunded: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
}
const STATUS_LABEL: Record<string, string> = { paid: 'שולם', pending: 'ממתין', failed: 'נכשל', refunded: 'הוחזר' }

export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('transactions')

  // Transactions
  const [payments, setPayments]         = useState<Payment[]>([])
  const [totalSuccess, setTotalSuccess] = useState(0)
  const [filter, setFilter]             = useState('all')
  const [loadingTx, setLoadingTx]       = useState(true)

  // Providers
  const [providers, setProviders]     = useState<ProviderConfig[]>([])
  const [loadingProv, setLoadingProv] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)

  // Health
  const [health, setHealth]         = useState<Record<string, HealthResult>>({})
  const [checkingHealth, setCheckingHealth] = useState(false)

  // Load transactions
  useEffect(() => {
    if (tab === 'transactions') {
      setLoadingTx(true)
      fetch(`/api/admin/payments${filter !== 'all' ? `?status=${filter}` : ''}`)
        .then(r => r.json())
        .then(d => { setPayments(d.payments || []); setTotalSuccess(d.totalSuccess || 0) })
        .finally(() => setLoadingTx(false))
    }
  }, [tab, filter])

  // Load providers
  const loadProviders = useCallback(async () => {
    setLoadingProv(true)
    try {
      const r = await fetch('/api/admin/payment-settings')
      const d = await r.json()
      setProviders(d.providers || [])
    } finally {
      setLoadingProv(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'providers') loadProviders()
  }, [tab, loadProviders])

  async function runHealthCheck() {
    setCheckingHealth(true)
    try {
      const r = await fetch('/api/admin/payment-settings/health')
      const d = await r.json()
      const map: Record<string, HealthResult> = {}
      for (const h of (d.results || [])) map[h.id] = h
      setHealth(map)
    } finally {
      setCheckingHealth(false)
    }
  }

  async function saveProviders() {
    setSaving(true)
    try {
      await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: providers.map(p => ({ providerId: p.providerId, enabled: p.enabled, priority: p.priority })) }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function toggleProvider(id: string) {
    setProviders(prev => prev.map(p => p.providerId === id ? { ...p, enabled: !p.enabled } : p))
  }

  function movePriority(id: string, dir: -1 | 1) {
    setProviders(prev => {
      const sorted = [...prev].sort((a, b) => a.priority - b.priority)
      const idx = sorted.findIndex(p => p.providerId === id)
      const swapIdx = idx + dir
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev
      const updated = [...sorted]
      const tmp = updated[idx].priority
      updated[idx] = { ...updated[idx], priority: updated[swapIdx].priority }
      updated[swapIdx] = { ...updated[swapIdx], priority: tmp }
      return updated
    })
  }

  const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority)
  const paidCount    = payments.filter(p => p.status === 'paid').length
  const failedCount  = payments.filter(p => p.status === 'failed').length
  const pendingCount = payments.filter(p => p.status === 'pending').length

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">תשלומים</h1>
          <p className="text-sm text-gray-500 mt-0.5">עסקאות, ניהול ספקים ובריאות מערכת</p>
        </div>
        {totalSuccess > 0 && (
          <div className="sm:mr-auto bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
            <p className="text-xs text-emerald-600">סה"כ הכנסות (שולם)</p>
            <p className="text-lg font-black text-emerald-400">{formatPrice(totalSuccess)}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6">
        {([['transactions','עסקאות'],['providers','ספקים'],['settings','הגדרות Webhook']] as [Tab,string][]).map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab===t ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-500 hover:text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TRANSACTIONS ── */}
      {tab === 'transactions' && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'שולם',  value: paidCount,    color: 'text-emerald-400' },
              { label: 'ממתין', value: pendingCount,  color: 'text-amber-400' },
              { label: 'נכשל',  value: failedCount,   color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-[#0E1525] border border-white/5 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 mb-4">
            {['all','paid','pending','failed','refunded'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter===f ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-600 hover:text-gray-300'}`}>
                {f === 'all' ? 'הכל' : STATUS_LABEL[f] || f}
              </button>
            ))}
          </div>

          {loadingTx ? (
            <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-14 bg-[#0E1525] rounded-2xl animate-pulse" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-20 bg-[#0E1525] border border-white/5 rounded-2xl">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-white font-semibold">אין עסקאות</p>
              <p className="text-xs text-gray-600 mt-1">כשלקוח ישלם — העסקה תופיע כאן</p>
            </div>
          ) : (
            <div className="bg-[#0E1525] border border-white/5 rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-6 gap-2 px-5 py-3 border-b border-white/5 text-xs font-medium text-gray-500">
                <span>הזמנה</span><span className="col-span-2">לקוח</span><span>סכום</span><span>סטטוס</span><span>תאריך</span>
              </div>
              <div className="divide-y divide-white/5">
                {payments.map(p => (
                  <div key={p._id} className="px-5 py-3.5 grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                    <span className="font-mono text-xs text-gray-400">{p.orderNumber}</span>
                    <span className="text-sm text-gray-300 md:col-span-2 truncate">{p.customer}</span>
                    <span className="font-bold text-white text-sm">{formatPrice(p.amount)}</span>
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full w-fit ${STATUS_CLR[p.status] || 'bg-gray-500/15 text-gray-500 border-gray-500/20'}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                    <span className="text-xs text-gray-600 hidden md:block">{new Date(p.createdAt).toLocaleDateString('he-IL')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PROVIDERS ── */}
      {tab === 'providers' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-sm text-gray-500 flex-1">הפעל/כבה ספקים, קבע עדיפות. הספק הפעיל הראשון המוגדר ישמש לתשלומים.</p>
            <button
              onClick={runHealthCheck}
              disabled={checkingHealth}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0E1525] text-gray-400 hover:text-white border border-white/10 transition-colors disabled:opacity-50">
              {checkingHealth ? 'בודק...' : 'בדיקת בריאות'}
            </button>
            <button
              onClick={saveProviders}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
              {saved ? 'נשמר!' : saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>

          {loadingProv ? (
            <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-20 bg-[#0E1525] rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {sortedProviders.map((prov, idx) => {
                const h = health[prov.providerId]
                return (
                  <div key={prov.providerId}
                    className={`bg-[#0E1525] border rounded-2xl p-4 transition-all ${prov.enabled ? 'border-blue-500/30' : 'border-white/5'}`}>
                    <div className="flex items-center gap-3">
                      {/* Priority arrows */}
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => movePriority(prov.providerId, -1)} disabled={idx === 0}
                          className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button onClick={() => movePriority(prov.providerId, 1)} disabled={idx === sortedProviders.length - 1}
                          className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <span className="text-2xl">{prov.logoEmoji}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{prov.name}</p>
                          <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${prov.countryCode === 'IL' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-purple-500/30 text-purple-400 bg-purple-500/10'}`}>
                            {prov.countryCode}
                          </span>
                          {prov.isConfigured ? (
                            <span className="text-[9px] font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">מוגדר</span>
                          ) : (
                            <span className="text-[9px] font-bold border border-white/10 text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full">לא מוגדר</span>
                          )}
                          {h && (
                            <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${h.ok ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                              {h.ok ? `${h.latency}ms` : 'שגיאה'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{prov.description}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={prov.docs} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-gray-600 hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                          docs
                        </a>
                        {/* Toggle */}
                        <button
                          onClick={() => toggleProvider(prov.providerId)}
                          className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${prov.enabled ? 'bg-blue-600' : 'bg-white/10'}`}
                          style={{ height: '22px', minWidth: '40px' }}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${prov.enabled ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-5 bg-[#0E1525] border border-white/5 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">איך זה עובד</p>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• הספק הפעיל הראשון עם אישורי גישה מוגדרים ישמש לכל תשלום חדש</li>
              <li>• אישורי API מוגדרים ב-Vercel Environment Variables — לא נשמרים במסד הנתונים</li>
              <li>• בדיקת בריאות בודקת נגישות בפועל לכל ספק מוגדר</li>
              <li>• שינוי עדיפות — החץ למעלה מעלה עדיפות (ייבחר קודם)</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── WEBHOOK SETTINGS ── */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-4">
          <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💳</span>
              <div>
                <h2 className="text-base font-bold text-white">Cardcom</h2>
                <p className="text-xs text-gray-500">הגדרות Webhook ומשתני סביבה</p>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-blue-400 mb-1">הגדרת פרטי חיבור</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                פרטי ה-API של Cardcom מוגדרים דרך <strong className="text-white">Vercel Environment Variables</strong> בלבד.
                זה אבטחה מכוונת — מניעת חשיפת פרטים רגישים בממשק הניהול.
              </p>
            </div>
            <div className="space-y-2.5 mb-4">
              {[
                { key: 'CARDCOM_TERMINAL_NUMBER', label: 'מספר מסוף' },
                { key: 'CARDCOM_API_USERNAME',    label: 'שם משתמש API' },
                { key: 'CARDCOM_API_PASSWORD',    label: 'סיסמת API' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-white/5">
                  <div>
                    <p className="text-xs text-gray-300 font-medium">{label}</p>
                    <code className="text-[10px] text-gray-600 font-mono">{key}</code>
                  </div>
                  <span className="text-[10px] font-bold border px-2 py-0.5 rounded-full border-amber-500/30 text-amber-400 bg-amber-500/10 whitespace-nowrap">
                    בדוק ב-Vercel
                  </span>
                </div>
              ))}
            </div>
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
              פתח Vercel Dashboard ↗
            </a>
          </div>

          <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Webhook URLs להגדרה ב-Cardcom</h3>
            <div className="space-y-3">
              {[
                { label: 'Payment Callback (IndicatorUrl)', url: 'https://project1-flame-phi.vercel.app/api/webhooks/payment',       color: 'text-blue-400' },
                { label: 'Success Redirect',               url: 'https://project1-flame-phi.vercel.app/checkout/success',           color: 'text-emerald-400' },
                { label: 'Cancel/Error Redirect',          url: 'https://project1-flame-phi.vercel.app/checkout/cancel',            color: 'text-red-400' },
              ].map(({ label, url, color }) => (
                <div key={url}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 bg-[#080C16] ${color} text-xs px-3 py-2 rounded-lg font-mono truncate`}>{url}</code>
                    <button onClick={() => navigator.clipboard.writeText(url)}
                      className="text-xs text-gray-500 hover:text-gray-300 bg-white/5 px-2 py-2 rounded-lg transition-colors flex-shrink-0">
                      העתק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
