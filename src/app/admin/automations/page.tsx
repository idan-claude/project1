'use client'

const AUTOMATIONS = [
  { title: 'מייל אישור הזמנה', sub: 'נשלח אוטומטית לאחר רכישה', status: 'soon' },
  { title: 'תזכורת עגלה נטושה', sub: 'SMS/WhatsApp לאחר 1 שעה', status: 'soon' },
  { title: 'עדכון סטטוס משלוח', sub: 'הודעה ללקוח כשהחבילה יצאה', status: 'soon' },
  { title: 'בקשת ביקורת', sub: 'אוטומציה 7 ימים אחרי מסירה', status: 'soon' },
  { title: 'התראת מלאי נמוך', sub: 'מייל למנהל כשמלאי מתחת לסף', status: 'soon' },
  { title: 'קמפיין חזרה', sub: 'הצעה ללקוחות שלא קנו 30+ יום', status: 'soon' },
]

export default function AutomationsPage() {
  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">אוטומציות</h1>
        <p className="text-sm text-gray-500 mt-0.5">תזרימי עבודה אוטומטיים</p>
      </div>

      <div className="bg-[#0E1525] border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-amber-400 text-lg flex-shrink-0">⚡</span>
        <div>
          <p className="text-sm font-semibold text-amber-400">מודול אוטומציות בפיתוח</p>
          <p className="text-xs text-gray-500 mt-0.5">חיבור Twilio + SMTP + WhatsApp יאפשר שליחה אוטומטית. הגדר את פרטי ה-API בהגדרות.</p>
        </div>
      </div>

      <div className="space-y-2">
        {AUTOMATIONS.map(item => (
          <div key={item.title} className="bg-[#0E1525] border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-gray-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400">{item.title}</p>
              <p className="text-xs text-gray-700 mt-0.5">{item.sub}</p>
            </div>
            <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-800 opacity-40 cursor-not-allowed">
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-gray-600 translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
