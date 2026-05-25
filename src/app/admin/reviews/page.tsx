'use client'
import { useEffect, useState } from 'react'

interface Review {
  _id: string
  customer: { name: string; email: string }
  productName: string
  rating: number
  text: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [pending, setPending] = useState(0)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)

  async function load(status: FilterStatus = filter) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews${status !== 'all' ? `?status=${status}` : ''}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setPending(data.pending || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  async function updateStatus(id: string, status: string) {
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  async function deleteReview(id: string) {
    if (!confirm('למחוק את הביקורת?')) return
    await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ביקורות לקוחות</h1>
          <p className="text-sm text-gray-500">
            {pending > 0 ? `${pending} ביקורות ממתינות לאישור` : 'כל הביקורות מאושרות'}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'all' as FilterStatus, label: 'הכל' },
          { key: 'pending' as FilterStatus, label: `ממתין (${pending})` },
          { key: 'approved' as FilterStatus, label: 'מאושר' },
          { key: 'rejected' as FilterStatus, label: 'נדחה' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-gray-600 font-semibold">אין ביקורות בקטגוריה זו</p>
          <p className="text-xs text-gray-400 mt-1">ביקורות יופיעו כאן לאחר שלקוחות יגישו אותן</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {review.customer.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{review.customer.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('he-IL')}
                        {review.productName ? ` · ${review.productName}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
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
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  {review.status !== 'approved' && (
                    <button onClick={() => updateStatus(review._id, 'approved')}
                      className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors">
                      אשר ✓
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button onClick={() => updateStatus(review._id, 'rejected')}
                      className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                      דחה ✗
                    </button>
                  )}
                  <button onClick={() => deleteReview(review._id)}
                    className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                    מחק
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
