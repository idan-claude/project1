'use client'

export default function AbandonedCartsPage() {
  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">עגלות נטושות</h1>
        <p className="text-sm text-gray-500">לקוחות שהתחילו תהליך רכישה ולא השלימו</p>
      </div>
      <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-gray-700 font-semibold text-base">אין עגלות נטושות כרגע</p>
        <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
          כשלקוח יוסיף מוצר לסל ולא ישלים את הרכישה — העגלה תופיע כאן
        </p>
      </div>
    </div>
  )
}
