'use client'
import { useEffect, useState } from 'react'

interface LogEntry {
  _id: string
  type: string
  description: string
  ip: string
  userAgent: string
  createdAt: string
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/audit-log?type=login_success&limit=50')
      .then(r => r.json())
      .then(d => {
        // Combine login_success and login_fail
        fetch('/api/admin/audit-log?type=login_fail&limit=30')
          .then(r2 => r2.json())
          .then(d2 => {
            const all = [...(d.logs ?? []), ...(d2.logs ?? [])]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 50)
            setLogs(all)
            setLoading(false)
          })
      })
      .catch(() => setLoading(false))
  }, [])

  const successCount = logs.filter(l => l.type === 'login_success').length
  const failCount = logs.filter(l => l.type === 'login_fail').length
  const uniqueIPs = [...new Set(logs.map(l => l.ip).filter(Boolean))].length

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">אבטחה</h1>
        <p className="text-sm text-gray-500 mt-0.5">היסטוריית כניסות ופעילות חשודה</p>
      </div>

      {/* Security status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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

      {/* Active protections */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5 mb-4">
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

      {/* Login history */}
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
