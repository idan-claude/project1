'use client'

export default function SecurityPage() {
  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">אבטחה</h1>
        <p className="text-sm text-gray-500 mt-0.5">כניסות, הרשאות ומעקב IP</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: 'היסטוריית כניסות',
            sub: 'מעקב אחר כניסות ניהול לפי IP ושעה',
            icon: '🔐',
            status: 'בפיתוח',
          },
          {
            title: 'חסימת IP',
            sub: 'הגדרת כתובות IP חסומות',
            icon: '🚫',
            status: 'בפיתוח',
          },
          {
            title: 'הרשאות משתמשים',
            sub: 'ניהול רמות הרשאה לצוות',
            icon: '🛡️',
            status: 'בפיתוח',
          },
          {
            title: '2FA אימות דו-שלבי',
            sub: 'הגנה נוספת על חשבון הניהול',
            icon: '🔑',
            status: 'בפיתוח',
          },
        ].map(item => (
          <div key={item.title} className="bg-[#0E1525] border border-white/5 rounded-xl p-5 flex items-start gap-4">
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{item.sub}</p>
            </div>
            <span className="text-[10px] text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full flex-shrink-0">{item.status}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#0E1525] border border-white/5 rounded-xl p-5">
        <h2 className="text-sm font-bold text-white mb-3">הגדרות אבטחה נוכחיות</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-gray-400">אימות JWT</span>
            <span className="text-emerald-400 text-xs font-medium">פעיל ✓</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-gray-400">Cookie httpOnly</span>
            <span className="text-emerald-400 text-xs font-medium">פעיל ✓</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">HTTPS</span>
            <span className="text-emerald-400 text-xs font-medium">פעיל (Vercel) ✓</span>
          </div>
        </div>
      </div>
    </div>
  )
}
