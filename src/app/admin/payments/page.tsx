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
  useEffect(() => {
    if (tab === 'transactions') loadPayments()
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

  const paidCount = payments.filter(p => p.status === 'paid').length
  const failedCount = payments.filter(p => p.status === 'failed').length
  const pendingCount = payments.filter(p => p.status === 'pending').length

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

      {/* CARDCOM SETTINGS — status only, credentials come from Vercel env vars */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-4">
          {/* Status card */}
          <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💳</span>
              <div>
                <h2 className="text-base font-bold text-white">Cardcom</h2>
                <p className="text-xs text-gray-500">שער תשלום ישראלי — קרדקום</p>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-blue-400 mb-1">הגדרת פרטי חיבור</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                פרטי ה-API של Cardcom מוגדרים דרך <strong className="text-white">Vercel Environment Variables</strong> בלבד — לא נשמרים במסד הנתונים.
                זה אבטחה מכוונת: מניעת חשיפת פרטים רגישים בממשק הניהול.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'CARDCOM_TERMINAL_NUMBER', label: 'מספר מסוף' },
                { key: 'CARDCOM_API_USERNAME', label: 'שם משתמש API' },
                { key: 'CARDCOM_API_PASSWORD', label: 'סיסמת API' },
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

            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              פתח Vercel Dashboard לעדכון משתנים ↗
            </a>
          </div>

          {/* Webhook URLs */}
          <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Webhook URLs להגדרה ב-Cardcom</h3>
            <div className="space-y-3">
              {[
                { label: 'Payment Callback (IndicatorUrl)', url: 'https://project1-flame-phi.vercel.app/api/webhooks/payment', color: 'text-blue-400' },
                { label: 'Success Redirect', url: 'https://project1-flame-phi.vercel.app/checkout/success', color: 'text-green-400' },
                { label: 'Cancel/Error Redirect', url: 'https://project1-flame-phi.vercel.app/checkout/cancel', color: 'text-red-400' },
              ].map(({ label, url, color }) => (
                <div key={url}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 bg-[#080C16] ${color} text-xs px-3 py-2 rounded-lg font-mono truncate`}>{url}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(url)}
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
