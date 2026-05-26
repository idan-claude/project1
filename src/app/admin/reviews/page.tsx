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

interface CarouselReview {
  name: string
  photo?: string
  rating: number
  text: string
  location?: string
  detail?: string
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'
type ActiveTab = 'customer' | 'carousel'

export default function ReviewsPage() {
  const [tab, setTab] = useState<ActiveTab>('customer')
  const [reviews, setReviews] = useState<Review[]>([])
  const [pending, setPending] = useState(0)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [loading, setLoading] = useState(true)

  // Carousel reviews state
  const [carouselReviews, setCarouselReviews] = useState<CarouselReview[]>([])
  const [carouselLoading, setCarouselLoading] = useState(true)
  const [carouselSaving, setCarouselSaving] = useState(false)
  const [carouselSaved, setCarouselSaved] = useState(false)

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

  async function loadCarousel() {
    setCarouselLoading(true)
    try {
      const res = await fetch('/api/admin/carousel-reviews')
      const data = await res.json()
      setCarouselReviews(data.reviews || [])
    } finally {
      setCarouselLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])
  useEffect(() => { loadCarousel() }, [])

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

  async function saveCarouselReviews() {
    setCarouselSaving(true)
    try {
      const res = await fetch('/api/admin/carousel-reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: carouselReviews }),
      })
      const data = await res.json()
      if (data.reviews) setCarouselReviews(data.reviews)
      setCarouselSaved(true)
      setTimeout(() => setCarouselSaved(false), 2500)
    } finally {
      setCarouselSaving(false)
    }
  }

  function addCarouselReview() {
    setCarouselReviews(r => [...r, { name: '', photo: '', rating: 5, text: '', location: '', detail: '' }])
  }

  function updateCarouselReview(i: number, field: keyof CarouselReview, value: string | number) {
    setCarouselReviews(r => r.map((x, j) => j === i ? { ...x, [field]: value } : x))
  }

  function removeCarouselReview(i: number) {
    setCarouselReviews(r => r.filter((_, j) => j !== i))
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

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('customer')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === 'customer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          ביקורות לקוחות
          {pending > 0 && <span className="mr-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pending}</span>}
        </button>
        <button
          onClick={() => setTab('carousel')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === 'carousel' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          ביקורות קרוסלה ({carouselReviews.length})
        </button>
      </div>

      {/* Customer reviews tab */}
      {tab === 'customer' && (
        <>
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
        </>
      )}

      {/* Carousel reviews tab */}
      {tab === 'carousel' && (
        <div className="max-w-2xl">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">ביקורות קרוסלה — מה זה?</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              הקרוסלה מופיעה <strong>בדף המוצר</strong> ממש מעל בחירת החבילה — חשיפה מקסימלית.
              השתמש בביקורות קצרות ועוצמתיות. <strong>כלל ברזל: אין חפיפת אנשים עם הביקורות בתחתית הדף.</strong>
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">ביקורות קרוסלה ({carouselReviews.length})</h2>
              <button
                onClick={addCarouselReview}
                className="text-xs text-blue-600 hover:text-blue-500 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                + הוסף ביקורת
              </button>
            </div>

            {carouselLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : carouselReviews.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">אין ביקורות קרוסלה — לחץ &quot;+ הוסף ביקורת&quot;</p>
            ) : (
              <div className="space-y-4">
                {carouselReviews.map((r, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">ביקורת {i + 1}</span>
                      <button onClick={() => removeCarouselReview(i)} className="text-xs text-red-500 hover:text-red-400">✕ הסר</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">שם</label>
                        <input
                          value={r.name}
                          onChange={e => updateCarouselReview(i, 'name', e.target.value)}
                          placeholder="ישראל י."
                          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">דירוג</label>
                        <select
                          value={r.rating}
                          onChange={e => updateCarouselReview(i, 'rating', Number(e.target.value))}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-400"
                        >
                          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ★</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">עיר</label>
                        <input
                          value={r.location || ''}
                          onChange={e => updateCarouselReview(i, 'location', e.target.value)}
                          placeholder="תל אביב"
                          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 mb-1">פרטים (לקוח X חודשים...)</label>
                        <input
                          value={r.detail || ''}
                          onChange={e => updateCarouselReview(i, 'detail', e.target.value)}
                          placeholder="לקוח 3 חודשים"
                          className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">תמונה (URL) — אופציונלי</label>
                      <input
                        value={r.photo || ''}
                        onChange={e => updateCarouselReview(i, 'photo', e.target.value)}
                        placeholder="https://..."
                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">טקסט הביקורת (קצר ועוצמתי)</label>
                      <textarea
                        value={r.text}
                        onChange={e => updateCarouselReview(i, 'text', e.target.value)}
                        placeholder="ביקורת קצרה וחזקה — עד 2 משפטים..."
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={saveCarouselReviews}
                disabled={carouselSaving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {carouselSaving ? 'שומר...' : 'שמור קרוסלה'}
              </button>
              {carouselSaved && <span className="text-green-600 text-sm font-medium">✓ נשמר — מסונכרן מיידית</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
