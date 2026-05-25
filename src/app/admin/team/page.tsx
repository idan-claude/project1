'use client'

export default function TeamPage() {
  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">צוות</h1>
        <p className="text-sm text-gray-500 mt-0.5">ניהול משתמשי מערכת והרשאות</p>
      </div>

      {/* Current admin */}
      <div className="bg-[#0E1525] border border-white/5 rounded-xl p-5 mb-4">
        <h2 className="text-xs text-gray-600 uppercase tracking-widest mb-3">מנהל ראשי</h2>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm">FC</div>
          <div>
            <p className="text-sm font-semibold text-white">FindCard Admin</p>
            <p className="text-xs text-gray-600">findcardsupport@gmail.com</p>
          </div>
          <span className="mr-auto text-[10px] text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full">ראשי</span>
        </div>
      </div>

      {/* Coming soon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: 'הזמנת משתמש חדש', sub: 'שלח הזמנה לאימייל' },
          { title: 'רמות הרשאה', sub: 'קורא / עורך / מנהל' },
          { title: 'לוג פעילות לפי משתמש', sub: 'מי עשה מה ומתי' },
          { title: 'ביטול גישה', sub: 'הסרת משתמש מהמערכת' },
        ].map(item => (
          <div key={item.title} className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex items-start gap-3 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-700 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-400">{item.title}</p>
              <p className="text-xs text-gray-700 mt-0.5">{item.sub}</p>
            </div>
            <span className="mr-auto text-[10px] text-gray-700 border border-white/5 px-2 py-0.5 rounded-full flex-shrink-0">בקרוב</span>
          </div>
        ))}
      </div>
    </div>
  )
}
