'use client'
import { useEffect, useState } from 'react'
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

type Tab = 'transactions' | 'settings' | 'providers'

const PROVIDERS = [
  { id: 'cardcom', name: 'Cardcom', logo: '💳', desc: 'שער תשלום ישראלי — מסופים וכרטיס אשראי', supported: true },
  { id: 'meshulam', name: 'Meshulam', logo: '🔷', desc: 'ממשק תשלום ישראלי', supported: false },
  { id: 'tranzila', name: 'Tranzila', logo: '🏦', desc: 'שיא בתשלומים מקוונים', supported: false },
  { id: 'hyp', name: 'Hyp', logo: '⚡', desc: 'ממשק תשלום מהיר', supported: false },
  { id: 'pelecard', name: 'Pelecard', logo: '🃏', desc: 'תשלומים וסליקה', supported: false },
  { id: 'stripe', name: 'Stripe', logo: '🌐', desc: 'תשלומים בינלאומיים', supported: false },
]

const STATUS_CLR: Record<string, string> = {
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  refunded: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
}
const STATUS_LABEL: Record<string, string> = { paid: 'שולם', pending: 'ממתין', failed: 'נכשל', refunded: 'הוחזר' }

export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('transactions')
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalSuccess, setTotalSuccess] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [cardcomSettings, setCardcomSettings] = useState({ terminal: '', username: '', password: '', testMode: true })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)

  useEffect(() => {
    if (tab === 'transactions') loadPayments()
    if (tab === 'settings') loadSettings()
  }, [tab, filter])

  async function loadPayments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payments${filter !== 'all' ? `?status=${filter}` : ''}`)
      const d = await res.json()
      setPayments(d.payments || [])
      setTotalSuccess(d.totalSuccess || 0)
    } finally {
      setLoading(false)
    }
  }

  async function loadSettings() {
    setLoadingSettings(true)
    try {
      const res = await fetch('/api/admin/settings?key=cardcom')
      const d = await res.json()
      if (d.settings) {
        setCardcomSettings({
          terminal: d.settings.terminal || '',
          username: d.settings.username || '',
          password: d.settings.password || '',
          testMode: d.settings.testMode !== false,
        })
      }
    } finally {
      setLoadingSettings(false)
    }
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'cardcom', value: cardcomSettings }),
      })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } finally {
      setSavingSettings(false)
    }
  }

  const paidCount = payments.filter(p => p.status === 'paid').length
  const failedCount = payments.filter(p => p.status === 'failed').length
  const pendingCount = payments.filter(p => p.status === 'pending').length

  const inputCls = 'w-full bg-[#080C16] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60'

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">תשלומים</h1>
          <p className="text-sm text-gray-500 mt-0.5">עסקאות, הגדרות ספקים וכלי ניהול</p>
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
        {([['transactions', 'עסקאות'], ['settings', 'הגדרות Cardcom'], ['providers', 'ספקים']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-500 hover:text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* TRANSACTIONS */}
      {tab === 'transactions' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'שולם', value: paidCount, color: 'text-emerald-400' },
              { label: 'ממתין', value: pendingCount, color: 'text-amber-400' },
              { label: 'נכשל', value: failedCount, color: 'text-red-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#0E1525] border border-white/5 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-1.5 mb-4">
            {['all', 'paid', 'pending', 'failed', 'refunded'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-600 hover:text-gray-300'}`}>
                {f === 'all' ? 'הכל' : STATUS_LABEL[f] || f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-[#0E1525] rounded-2xl animate-pulse" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-20 bg-[#0E1525] border border-white/5 rounded-2xl">
              <p className="text-4xl mb-3">💳</p>
              <p className="text-white font-semibold">אין עסקאות</p>
              <p className="text-xs text-gray-600 mt-1">כשלקוח ישלם — העסקה תופיע כאן</p>
            </div>
          ) : (
            <div className="bg-[#0E1525] border border-white/5 rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-6 gap-2 px-5 py-3 border-b border-white/5 text-xs font-medium text-gray-500">
                <span className="col-span-1">הזמנה</span>
                <span className="col-span-2">לקוח</span>
                <span>סכום</span>
                <span>סטטוס</span>
                <span>תאריך</span>
              </div>
              <div className="divide-y divide-white/5">
                {payments.map((p) => (
                  <div key={p._id} className="px-5 py-3.5 grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                    <span className="font-mono text-xs text-gray-400">{p.orderNumber}</span>
                    <span className="text-sm text-gray-300 md:col-span-2 truncate">{p.customer}</span>
                    <span className="font-bold text-white text-sm">{formatPrice(p.amount)}</span>
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full w-fit ${STATUS_CLR[p.status] || 'bg-gray-500/15 text-gray-500 border-gray-500/20'}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                    <span className="text-xs text-gray-600 hidden md:block">
                      {new Date(p.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CARDCOM SETTINGS */}
      {tab === 'settings' && (
        <div className="max-w-lg">
          <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💳</span>
              <div>
                <h2 className="text-base font-bold text-white">Cardcom</h2>
                <p className="text-xs text-gray-600">שער תשלום ישראלי — קרדקום</p>
              </div>
            </div>

            {loadingSettings ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-11 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">מספר מסוף (Terminal Number)</label>
                  <input className={inputCls} value={cardcomSettings.terminal}
                    onChange={e => setCardcomSettings(p => ({ ...p, terminal: e.target.value }))}
                    placeholder="1234" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">שם משתמש API</label>
                  <input className={inputCls} value={cardcomSettings.username}
                    onChange={e => setCardcomSettings(p => ({ ...p, username: e.target.value }))}
                    placeholder="user@cardcom.co.il" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">סיסמת API</label>
                  <input className={inputCls} type="password" value={cardcomSettings.password}
                    onChange={e => setCardcomSettings(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${cardcomSettings.testMode ? 'bg-amber-500' : 'bg-emerald-600'}`}
                    onClick={() => setCardcomSettings(p => ({ ...p, testMode: !p.testMode }))}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${cardcomSettings.testMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <span className="text-sm text-gray-300">{cardcomSettings.testMode ? 'מצב בדיקה (Test Mode)' : 'מצב ייצור (Live Mode)'}</span>
                    <p className="text-xs text-gray-600">{cardcomSettings.testMode ? 'עסקאות לא אמיתיות' : 'עסקאות אמיתיות'}</p>
                  </div>
                </label>

                <div className="pt-2 border-t border-white/5">
                  <button onClick={saveSettings} disabled={savingSettings}
                    className={`bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors ${settingsSaved ? 'bg-emerald-600' : ''}`}>
                    {savingSettings ? '⏳ שומר...' : settingsSaved ? '✓ נשמר' : 'שמור הגדרות'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-[#0E1525] border border-amber-500/20 rounded-2xl p-4 mt-4 flex items-start gap-3">
            <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-amber-400">הגדרות נשמרות למסד הנתונים</p>
              <p className="text-xs text-gray-600 mt-0.5">
                לאבטחה מירבית, הגדר את הפרטים גם ב-Vercel Environment Variables:
                CARDCOM_TERMINAL_NUMBER, CARDCOM_API_USERNAME, CARDCOM_API_PASSWORD.
                הערכים מ-Vercel גוברים על אלה שנשמרו כאן.
              </p>
            </div>
          </div>

          <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mt-4">
            <h3 className="text-sm font-semibold text-white mb-3">Webhook URLs</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Callback (IndicatorUrl)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#080C16] text-blue-400 text-xs px-3 py-2 rounded-lg font-mono truncate">
                    https://project1-flame-phi.vercel.app/api/webhooks/payment
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText('https://project1-flame-phi.vercel.app/api/webhooks/payment')}
                    className="text-xs text-gray-500 hover:text-gray-300 bg-white/5 px-2 py-2 rounded-lg transition-colors">
                    העתק
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Success Redirect</p>
                <code className="block bg-[#080C16] text-green-400 text-xs px-3 py-2 rounded-lg font-mono truncate">
                  https://project1-flame-phi.vercel.app/checkout/success
                </code>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Cancel/Error Redirect</p>
                <code className="block bg-[#080C16] text-red-400 text-xs px-3 py-2 rounded-lg font-mono truncate">
                  https://project1-flame-phi.vercel.app/checkout/cancel
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROVIDERS */}
      {tab === 'providers' && (
        <div>
          <p className="text-sm text-gray-500 mb-5">כל ספקי התשלום הנתמכים ועתידיים</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROVIDERS.map(prov => (
              <div key={prov.id}
                className={`bg-[#0E1525] border rounded-2xl p-4 transition-colors ${prov.supported ? 'border-blue-500/30' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{prov.logo}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{prov.name}</p>
                    <p className="text-xs text-gray-600">{prov.desc}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${prov.supported ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-white/10 text-gray-600 bg-white/5'}`}>
                  {prov.supported ? 'מחובר ומוכן' : 'בפיתוח'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
