'use client'
import { useEffect, useState, useCallback } from 'react'

type ActiveTab = 'logins' | 'visitors' | 'blocklist' | 'suspicious'

// ── Login History ────────────────────────────────────────────────────────────
interface LogEntry {
  _id: string
  type: string
  description: string
  ip: string
  userAgent: string
  createdAt: string
}

function LoginHistoryTab() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/audit-log?type=login_success&limit=50').then(r => r.json()),
      fetch('/api/admin/audit-log?type=login_fail&limit=30').then(r => r.json()),
    ])
      .then(([d, d2]) => {
        const all = [...(d.logs ?? []), ...(d2.logs ?? [])]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 50)
        setLogs(all)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const successCount = logs.filter(l => l.type === 'login_success').length
  const failCount = logs.filter(l => l.type === 'login_fail').length
  const uniqueIPs = Array.from(new Set(logs.map(l => l.ip).filter(Boolean))).length

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-black text-emerald-400">{successCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">כניסות מוצלחות</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className={`text-2xl font-black ${failCount > 0 ? 'text-red-400' : 'text-gray-600'}`}>{failCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">ניסיונות כושלים</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <p className="text-2xl font-black text-blue-400">{uniqueIPs}</p>
          <p className="text-xs text-gray-500 mt-0.5">כתובות IP</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm font-semibold text-emerald-400">פעיל</p>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">מצב מערכת</p>
        </div>
      </div>

      <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-3">הגנות פעילות</h2>
        <div className="space-y-2 text-sm">
          {[
            ['אימות JWT מוצפן', 'פעיל'],
            ['Cookie HttpOnly', 'פעיל'],
            ['HTTPS (Vercel TLS)', 'פעיל'],
            ['Session 7 ימים', 'פעיל'],
          ].map(([name, status]) => (
            <div key={name} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-gray-400">{name}</span>
              <span className="text-emerald-400 text-xs font-medium">{status} ✓</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">היסטוריית כניסות</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">
            <p>אין היסטוריית כניסות עדיין</p>
            <p className="text-xs mt-1 text-gray-700">הכניסות הבאות ירשמו כאן אוטומטית</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map(log => (
              <div key={log._id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02]">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs ${
                  log.type === 'login_success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {log.type === 'login_success' ? '✓' : '✕'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white">{log.description}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                    IP: {log.ip || '—'} · {log.userAgent?.slice(0, 60) || '—'}
                  </p>
                </div>
                <time className="text-[11px] text-gray-700 flex-shrink-0">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Visitors Tab ─────────────────────────────────────────────────────────────
interface VisitorRow {
  ip: string
  sessions: number
  visitors: number
  events: number
  lastSeen: string
  firstSeen: string
  country: string
  city: string
  device: string
  blockStatus: string | null
  converted: boolean
  addedToCart: boolean
}

interface SessionDetail {
  sessionId: string
  visitorId: string
  ip: string
  device: string
  country: string
  firstSeen: string
  lastSeen: string
  durationSeconds: number
  converted: boolean
  addedToCart: boolean
  events: Array<{ event: string; path: string; scroll: number; meta: Record<string, unknown>; createdAt: string }>
}

function VisitorsTab() {
  const [visitors, setVisitors] = useState<VisitorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchIp, setSearchIp] = useState('')
  const [searchVid, setSearchVid] = useState('')
  const [sessions, setSessions] = useState<SessionDetail[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [openSession, setOpenSession] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/security/visitors')
      .then(r => r.json())
      .then(d => setVisitors(d.visitors ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const search = useCallback(async () => {
    if (!searchIp && !searchVid) return
    setSearching(true)
    setSessions(null)
    const params = new URLSearchParams()
    if (searchIp) params.set('ip', searchIp)
    if (searchVid) params.set('visitorId', searchVid)
    fetch(`/api/admin/security/visitors?${params}`)
      .then(r => r.json())
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setSearching(false))
  }, [searchIp, searchVid])

  const clearSearch = () => {
    setSearchIp('')
    setSearchVid('')
    setSessions(null)
  }

  const formatDur = (s: number) => s < 60 ? `${s}ש` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}ד`

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-white">חיפוש מבקר</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={searchIp}
            onChange={e => setSearchIp(e.target.value)}
            placeholder="IP (דוגמה: 192.168)"
            className="flex-1 bg-[#080C16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500"
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <input
            value={searchVid}
            onChange={e => setSearchVid(e.target.value)}
            placeholder="Visitor ID"
            className="flex-1 bg-[#080C16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500"
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button
            onClick={search}
            disabled={searching || (!searchIp && !searchVid)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg font-medium transition-colors"
          >
            {searching ? 'מחפש...' : 'חפש'}
          </button>
          {sessions !== null && (
            <button onClick={clearSearch} className="px-4 py-2 bg-[#0E1525] border border-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors">
              נקה
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {sessions !== null && (
        <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-bold text-white">{sessions.length} סשנים נמצאו</p>
          </div>
          {sessions.length === 0 ? (
            <p className="p-6 text-center text-gray-600 text-sm">לא נמצאו תוצאות</p>
          ) : (
            <div className="divide-y divide-white/5">
              {sessions.map(s => (
                <div key={s.sessionId}>
                  <button
                    onClick={() => setOpenSession(openSession === s.sessionId ? null : s.sessionId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] text-right"
                  >
                    <span className="text-base flex-shrink-0">{s.converted ? '✅' : s.addedToCart ? '🛒' : '👁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-mono truncate">{s.sessionId.slice(0, 12)}... · {s.ip}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{s.device} · {s.country || '—'} · {s.events.length} אירועים · {formatDur(s.durationSeconds)}</p>
                    </div>
                    <span className="text-[10px] text-gray-700 flex-shrink-0">{new Date(s.lastSeen).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`text-gray-500 text-xs flex-shrink-0 transition-transform ${openSession === s.sessionId ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {openSession === s.sessionId && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-1.5">
                      {s.events.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-gray-500 w-14 flex-shrink-0">{new Date(e.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span className="text-blue-300 font-medium flex-shrink-0">{e.event}</span>
                          {e.path && <span className="text-gray-600 truncate">{e.path}</span>}
                          {e.scroll > 0 && <span className="text-gray-700">· {e.scroll}%</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent IPs table */}
      {sessions === null && (
        <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-bold text-white">IP-ים פעילים — 7 ימים אחרונים</p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
          ) : visitors.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">אין נתונים עדיין</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-gray-600">
                    <th className="px-4 py-2 text-right font-medium">IP</th>
                    <th className="px-3 py-2 text-right font-medium">מדינה</th>
                    <th className="px-3 py-2 text-right font-medium">סשנים</th>
                    <th className="px-3 py-2 text-right font-medium">אירועים</th>
                    <th className="px-3 py-2 text-right font-medium">הרנה</th>
                    <th className="px-3 py-2 text-right font-medium">ביקור אחרון</th>
                    <th className="px-3 py-2 text-right font-medium">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {visitors.map((v, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-gray-300">{v.ip}</td>
                      <td className="px-3 py-3 text-gray-500">{v.country || '—'}</td>
                      <td className="px-3 py-3 text-gray-400">{v.sessions}</td>
                      <td className="px-3 py-3 text-gray-400">{v.events}</td>
                      <td className="px-3 py-3">
                        {v.converted ? <span className="text-emerald-400">✅ קנה</span>
                          : v.addedToCart ? <span className="text-amber-400">🛒 עגלה</span>
                          : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{new Date(v.lastSeen).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-3 py-3">
                        {v.blockStatus === 'block' ? <span className="text-red-400 text-[10px] font-medium bg-red-500/10 px-2 py-0.5 rounded-full">חסום</span>
                          : v.blockStatus === 'whitelist' ? <span className="text-emerald-400 text-[10px] font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">מאושר</span>
                          : <span className="text-gray-700 text-[10px]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Blocklist Tab ─────────────────────────────────────────────────────────────
interface BlockEntry {
  _id: string
  ipMasked: string
  type: 'block' | 'whitelist'
  reason: string
  expiresAt: string | null
  createdBy: string
  createdAt: string
}

function BlocklistTab() {
  const [entries, setEntries] = useState<BlockEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'block' | 'whitelist'>('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ ip: '', type: 'block' as 'block' | 'whitelist', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    const params = filter !== 'all' ? `?type=${filter}` : ''
    fetch(`/api/admin/security/blocklist${params}`)
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!form.ip.trim()) { setError('IP נדרש'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/security/blocklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setAdding(false)
      setForm({ ip: '', type: 'block', reason: '' })
      load()
    } else {
      const d = await res.json()
      setError(d.error || 'שגיאה')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק רשומה זו?')) return
    await fetch('/api/admin/security/blocklist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter)

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1.5">
          {(['all', 'block', 'whitelist'] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === t ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-500 hover:text-gray-300'}`}>
              {t === 'all' ? 'הכל' : t === 'block' ? 'חסומים' : 'מאושרים'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="sm:mr-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          + הוסף רשומה
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-[#0E1525] border border-white/10 rounded-xl p-5 space-y-3">
          <p className="text-sm font-bold text-white">הוספת IP לרשימה</p>
          <input
            value={form.ip}
            onChange={e => setForm(f => ({ ...f, ip: e.target.value }))}
            placeholder="כתובת IP מלאה (לדוגמה: 1.2.3.4)"
            className="w-full bg-[#080C16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as 'block' | 'whitelist' }))}
              className="bg-[#080C16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="block">חסום</option>
              <option value="whitelist">מאושר</option>
            </select>
            <input
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="סיבה (אופציונלי)"
              className="flex-1 bg-[#080C16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors">
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 bg-[#0E1525] border border-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-sm font-bold text-white">{filtered.length} רשומות</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-600 text-sm">אין רשומות עדיין</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(entry => (
              <div key={entry._id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${entry.type === 'block' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                  {entry.type === 'block' ? 'חסום' : 'מאושר'}
                </span>
                <span className="font-mono text-gray-300 text-xs">{entry.ipMasked}</span>
                <span className="flex-1 text-gray-600 text-xs truncate">{entry.reason || '—'}</span>
                <span className="text-gray-700 text-[10px] flex-shrink-0">{new Date(entry.createdAt).toLocaleDateString('he-IL')}</span>
                <button onClick={() => handleDelete(entry._id)} className="text-gray-700 hover:text-red-400 text-xs flex-shrink-0 transition-colors px-1">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Suspicious Tab ────────────────────────────────────────────────────────────
interface SuspiciousIp {
  ip: string
  sessions: number
  visitors: number
  rageClicks: number
  checkoutStarts: number
  purchases: number
  lastSeen: string
  country: string
  city: string
  fraudScore: number
  signals: string[]
}

interface SuspiciousSession {
  sessionId: string
  visitorId: string
  ip: string
  country: string
  device: string
  checkoutStarts: number
  purchases: number
  rageClicks: number
  lastSeen: string
  fraudScore: number
  signals: string[]
}

function SuspiciousTab() {
  const [data, setData] = useState<{ suspiciousIps: SuspiciousIp[]; suspiciousSessions: SuspiciousSession[]; totalFlagged: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'ips' | 'sessions'>('ips')

  useEffect(() => {
    fetch('/api/admin/security/suspicious')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const scoreColor = (s: number) => s >= 61 ? 'text-red-400' : s >= 31 ? 'text-amber-400' : 'text-emerald-400'
  const scoreBg = (s: number) => s >= 61 ? 'bg-red-500/15' : s >= 31 ? 'bg-amber-500/15' : 'bg-emerald-500/15'

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
            <p className={`text-2xl font-black ${data.totalFlagged > 0 ? 'text-red-400' : 'text-gray-600'}`}>{data.totalFlagged}</p>
            <p className="text-xs text-gray-500 mt-0.5">סה"כ מסומנים</p>
          </div>
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
            <p className="text-2xl font-black text-amber-400">{data.suspiciousIps.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">IP חשודים</p>
          </div>
          <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4">
            <p className="text-2xl font-black text-orange-400">{data.suspiciousSessions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">סשנים חשודים</p>
          </div>
        </div>
      )}

      {/* Fraud score legend */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>ציון הונאה: <span className="text-emerald-400">0-30 נקי</span> · <span className="text-amber-400">31-60 מעקב</span> · <span className="text-red-400">61+ חשוד</span></span>
        <span className="text-gray-700">כלל: rage clicks ×15, נטישות תשלום ×12, 5+ ניסיונות תשלום +20</span>
      </div>

      <div className="flex gap-1.5">
        {(['ips', 'sessions'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === v ? 'bg-blue-600 text-white' : 'bg-[#0E1525] text-gray-500 hover:text-gray-300'}`}>
            {v === 'ips' ? 'IP חשודים' : 'סשנים חשודים'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-600 text-sm">טוען...</div>
      ) : !data ? (
        <div className="p-8 text-center text-gray-600 text-sm">שגיאה בטעינה</div>
      ) : view === 'ips' ? (
        <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-bold text-white">{data.suspiciousIps.length} IP חשודים · 7 ימים אחרונים</p>
          </div>
          {data.suspiciousIps.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">
              <p className="text-emerald-400 font-medium">ללא פעילות חשודה</p>
              <p className="text-xs mt-1 text-gray-700">לא נמצאו IP-ים עם rage clicks ≥2 או 3+ ניסיונות תשלום</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.suspiciousIps.map((s, i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${scoreBg(s.fraudScore)}`}>
                      <span className={`text-sm font-black ${scoreColor(s.fraudScore)}`}>{s.fraudScore}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-gray-200 text-sm">{s.ip}</span>
                        {s.country && <span className="text-xs text-gray-600">{s.city ? `${s.city}, ` : ''}{s.country}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {s.signals.map((sig, j) => (
                          <span key={j} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{sig}</span>
                        ))}
                      </div>
                      <div className="flex gap-4 mt-2 text-[10px] text-gray-600">
                        <span>{s.sessions} סשנים</span>
                        <span>{s.rageClicks} rage clicks</span>
                        <span>{s.checkoutStarts} ניסיונות תשלום</span>
                        <span>{s.purchases} checkout_complete</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-700 flex-shrink-0">{new Date(s.lastSeen).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0E1525] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-bold text-white">{data.suspiciousSessions.length} סשנים חשודים · 24 שעות אחרונות</p>
          </div>
          {data.suspiciousSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">
              <p className="text-emerald-400 font-medium">ללא פעילות חשודה</p>
              <p className="text-xs mt-1 text-gray-700">לא נמצאו סשנים עם 2+ ניסיונות תשלום או 3+ rage clicks</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.suspiciousSessions.map((s, i) => (
                <div key={i} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${scoreBg(s.fraudScore)}`}>
                      <span className={`text-sm font-black ${scoreColor(s.fraudScore)}`}>{s.fraudScore}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-gray-400 text-xs">{s.sessionId}</span>
                        <span className="text-xs text-gray-600">{s.device} · {s.ip}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {s.signals.map((sig, j) => (
                          <span key={j} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{sig}</span>
                        ))}
                      </div>
                      <div className="flex gap-4 mt-2 text-[10px] text-gray-600">
                        <span>{s.checkoutStarts} ניסיונות תשלום</span>
                        <span>{s.rageClicks} rage clicks</span>
                        <span>{s.purchases} checkout_complete</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-700 flex-shrink-0">{new Date(s.lastSeen).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SecurityPage() {
  const [tab, setTab] = useState<ActiveTab>('logins')

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'logins', label: 'היסטוריית כניסות' },
    { id: 'visitors', label: 'מבקרים' },
    { id: 'blocklist', label: 'רשימת חסימה' },
    { id: 'suspicious', label: 'חשודים' },
  ]

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">אבטחה</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניטור מבקרים, ניהול חסימות וזיהוי פעילות חשודה</p>
      </div>

      <div className="flex gap-1 bg-[#0E1525] border border-white/5 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-max px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'logins' && <LoginHistoryTab />}
      {tab === 'visitors' && <VisitorsTab />}
      {tab === 'blocklist' && <BlocklistTab />}
      {tab === 'suspicious' && <SuspiciousTab />}
    </div>
  )
}
