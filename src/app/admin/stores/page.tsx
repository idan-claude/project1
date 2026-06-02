'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Store {
  storeId: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'pending' | 'setup'
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  createdAt: string
}

type P = { className?: string }
function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>{children}</svg>
}
const IPlus      = (p: P) => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
const IArrow     = (p: P) => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>
const IStore     = (p: P) => <Svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>
const ICheck     = (p: P) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>
const ISettings  = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>

const STATUS_META: Record<string, { label: string; classes: string }> = {
  active:    { label: 'פעיל',       classes: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  setup:     { label: 'בהגדרה',    classes: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  pending:   { label: 'ממתין',     classes: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  suspended: { label: 'מושהה',     classes: 'bg-red-500/10 border-red-500/20 text-red-400' },
}

const PLAN_LABEL: Record<string, string> = { free: 'חינם', starter: 'סטארטר', pro: 'פרו', enterprise: 'אנטרפרייז' }

export default function StoresPage() {
  const [stores, setStores]   = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({ storeName: '' })
  const [createError, setCreateError] = useState('')
  const [creating_, setCreating_] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/stores')
      const d = await r.json()
      setStores(d.stores || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function switchStore(storeId: string) {
    try {
      await fetch('/api/admin/stores/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      })
      window.location.href = '/admin'
    } catch {
      alert('שגיאה בהחלפת חנות')
    }
  }

  async function createStore() {
    if (!newForm.storeName.trim()) { setCreateError('נא להזין שם חנות'); return }
    setCreating_(true)
    setCreateError('')
    try {
      const r = await fetch('/api/admin/stores/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName: newForm.storeName }),
      })
      const d = await r.json()
      if (!r.ok) { setCreateError(d.error || 'שגיאה ביצירת חנות'); return }
      setCreating(false)
      setNewForm({ storeName: '' })
      await load()
    } finally {
      setCreating_(false)
    }
  }

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold text-white">החנויות שלי</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {loading ? 'טוען...' : `${stores.length} ${stores.length === 1 ? 'חנות' : 'חנויות'}`}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <IPlus className="w-4 h-4" />
          חנות חדשה
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-[#0E1629] border border-blue-500/20 rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-white mb-3">יצירת חנות חדשה</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-400 mb-1.5">שם החנות</label>
              <input
                type="text"
                value={newForm.storeName}
                onChange={e => { setNewForm({ storeName: e.target.value }); setCreateError('') }}
                placeholder="לדוגמה: החנות החדשה שלי"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && createStore()}
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 max-w-sm"
              />
              {createError && <p className="text-red-400 text-[11px] mt-1">{createError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCreating(false); setCreateError('') }}
                className="px-4 py-2 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">
                ביטול
              </button>
              <button onClick={createStore} disabled={creating_}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {creating_ ? 'יוצר...' : 'צור חנות'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stores list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-[#0E1629] rounded-2xl animate-pulse border border-white/[0.055]" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-16 bg-[#0E1629] border border-white/[0.055] rounded-2xl">
          <IStore className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">אין חנויות עדיין</p>
          <p className="text-gray-600 text-sm">לחץ &quot;חנות חדשה&quot; כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map(store => {
            const statusMeta = STATUS_META[store.status] ?? STATUS_META.setup
            return (
              <div key={store.storeId}
                className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5 hover:border-white/[0.09] transition-all group">
                <div className="flex items-start gap-4">
                  {/* Store icon */}
                  <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <IStore className="w-5 h-5 text-blue-400" />
                  </div>

                  {/* Store info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-[14px] font-bold text-white">{store.name}</p>
                      <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${statusMeta.classes}`}>
                        {statusMeta.label}
                      </span>
                      <span className="text-[10px] font-semibold border border-white/10 text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {PLAN_LABEL[store.plan] ?? store.plan}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{store.slug} · נוצר {new Date(store.createdAt).toLocaleDateString('he-IL')}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/settings`}
                      className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.055] text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all">
                      <ISettings className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => switchStore(store.storeId)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-semibold rounded-xl transition-colors"
                    >
                      <ICheck className="w-3 h-3" />
                      הפעל
                    </button>
                    <Link href={`/admin`}
                      className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.055] text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all opacity-0 group-hover:opacity-100">
                      <IArrow className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="mt-6 bg-[#0E1629] border border-white/[0.055] rounded-xl px-4 py-3">
        <p className="text-[11px] text-gray-500">
          לחץ &quot;הפעל&quot; כדי לעבוד עם חנות אחרת. כל החנויות מנוהלות ממשק אחד.
        </p>
      </div>
    </div>
  )
}
