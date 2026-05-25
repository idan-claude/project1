'use client'
import { useEffect, useState } from 'react'

interface AuditEntry { actor: string; description: string; ip: string; createdAt: string; type: string }

export default function TeamPage() {
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/audit-log?limit=5')
      .then(r => r.json())
      .then(d => setRecentActivity(d.logs || []))
      .catch(() => setRecentActivity([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">צוות</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניהול גישות ופעילות מנהלים</p>
      </div>

      {/* Current admin */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-4">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">מנהל ראשי</p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm flex-shrink-0">FC</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">FindCard Admin</p>
            <p className="text-xs text-gray-500 mt-0.5">findcardsupport@gmail.com</p>
            <p className="text-xs text-gray-700 mt-0.5">גישה מלאה לכל הפונקציות</p>
          </div>
          <span className="text-[10px] text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full">פעיל</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">פעילות אחרונה</h2>
        <p className="text-xs text-gray-600 mb-4">כניסות ופעולות ניהוליות מהיסטוריית AuditLog</p>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}</div>
        ) : recentActivity.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-6">אין פעילות מתועדת</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className={`text-sm ${entry.type === 'login_success' ? 'text-emerald-400' : entry.type === 'login_fail' ? 'text-red-400' : 'text-blue-400'}`}>
                  {entry.type === 'login_success' ? '🔑' : entry.type === 'login_fail' ? '⚠️' : '⚡'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{entry.description}</p>
                  <p className="text-[10px] text-gray-700">{entry.ip || 'IP לא ידוע'}</p>
                </div>
                <span className="text-[10px] text-gray-700 flex-shrink-0">
                  {new Date(entry.createdAt).toLocaleDateString('he-IL')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-user info */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">ניהול משתמשים מרובים</h2>
        <p className="text-xs text-gray-600 mb-4">תמיכה בצוות עם רמות הרשאה שונות — זמין בגרסה הבאה</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '📧', title: 'הזמנת חבר צוות', desc: 'שלח הזמנה לכתובת מייל' },
            { icon: '🛡️', title: 'רמות הרשאה', desc: 'קורא / עורך / מנהל' },
            { icon: '📋', title: 'לוג פעילות לפי משתמש', desc: 'מי עשה מה ומתי' },
            { icon: '🔒', title: '2FA', desc: 'אימות דו-שלבי לכל משתמש' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl border border-white/5 opacity-50">
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-400">{item.title}</p>
                <p className="text-xs text-gray-700 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-700 mt-3 text-center">
          Multi-user support מגיע עם מודול ה-Multi-store בגרסה הבאה
        </p>
      </div>
    </div>
  )
}
