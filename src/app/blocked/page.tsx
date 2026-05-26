export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">הגישה חסומה</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          הגישה לאתר חסומה מכתובת ה-IP שלך.
          <br />
          אם אתה חושב שמדובר בטעות, צור קשר עם שירות הלקוחות.
        </p>
      </div>
    </div>
  )
}
