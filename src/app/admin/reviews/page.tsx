'use client'
import { useState } from 'react'

const MOCK_REVIEWS = [
  { id: '1', name: 'יעל כהן', rating: 5, text: 'מוצר מצוין! נכנס בול לארנק ומוצא לי את המפתחות תמיד. ממליצה בחום!', product: 'FindCard PRO', date: '2026-05-20', status: 'approved' },
  { id: '2', name: 'דני לוי', rating: 4, text: 'עובד טוב, הגדרה קצת בלגן בהתחלה אבל אחרי זה סבבה. שירות לקוחות מגיב מהר', product: 'FindCard PRO', date: '2026-05-19', status: 'approved' },
  { id: '3', name: 'מירי שמיר', rating: 3, text: 'בסדר. הבלוטות לא תמיד יציב אבל Find My עובד מצוין', product: 'FindCard PRO', date: '2026-05-18', status: 'pending' },
  { id: '4', name: 'רועי גבע', rating: 5, text: 'שלמתי ופחות מ3 ימים הגיע! האריזה יפה והמוצר עובד ממש טוב', product: 'FindCard PRO', date: '2026-05-17', status: 'approved' },
  { id: '5', name: 'אור אביגד', rating: 2, text: 'לא הצלחתי להגדיר. שלחתי מייל ועדיין מחכה לתשובה...', product: 'FindCard PRO', date: '2026-05-16', status: 'pending' },
]

type ReviewStatus = 'all' | 'pending' | 'approved' | 'rejected'

export default function ReviewsPage() {
  const [filter, setFilter] = useState<ReviewStatus>('all')
  const [reviews, setReviews] = useState(MOCK_REVIEWS)

  const filtered = reviews.filter((r) => filter === 'all' || r.status === filter)

  const updateStatus = (id: string, status: string) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
  }

  const pending = reviews.filter((r) => r.status === 'pending').length

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ביקורות לקוחות</h1>
          <p className="text-sm text-gray-500">{pending > 0 ? `${pending} ביקורות ממתינות לאישור` : 'כל הביקורות מאושרות'}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'הכל' },
          { key: 'pending', label: `ממתין (${pending})` },
          { key: 'approved', label: 'מאושר' },
          { key: 'rejected', label: 'נדחה' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as ReviewStatus)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                    <p className="text-xs text-gray-400">{review.date} · {review.product}</p>
                  </div>
                  <div className="flex gap-0.5 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                    ))}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    review.status === 'approved' ? 'bg-green-100 text-green-700' :
                    review.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {review.status === 'approved' ? 'מאושר' : review.status === 'pending' ? 'ממתין' : 'נדחה'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
              </div>
              {review.status === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateStatus(review.id, 'approved')}
                    className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    אשר ✓
                  </button>
                  <button
                    onClick={() => updateStatus(review.id, 'rejected')}
                    className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    דחה ✗
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-gray-500">אין ביקורות בקטגוריה זו</p>
          </div>
        )}
      </div>
    </div>
  )
}
