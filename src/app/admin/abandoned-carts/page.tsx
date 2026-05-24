'use client'
import { useState } from 'react'

const MOCK_CARTS = [
  { id: '1', name: 'נועה ב', email: 'noa@gmail.com', phone: '052-1234567', items: ['FindCard PRO x1'], total: 19990, time: '14:32', reminder: false },
  { id: '2', name: 'אביב כ', email: 'aviv@walla.co.il', phone: '054-9876543', items: ['FindCard PRO x2'], total: 29990, time: '13:15', reminder: true },
  { id: '3', name: 'גיא מ', email: 'guy@gmail.com', phone: '050-1122334', items: ['FindCard PRO x1'], total: 19990, time: '12:48', reminder: false },
  { id: '4', name: 'שני א', email: 'shani@hotmail.com', phone: '053-5544332', items: ['FindCard PRO x3'], total: 37990, time: '11:20', reminder: false },
  { id: '5', name: 'ליאור ה', email: 'lior@gmail.com', phone: '058-7788990', items: ['FindCard PRO x1'], total: 19990, time: '10:55', reminder: true },
]

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState(MOCK_CARTS)
  const [sending, setSending] = useState<string | null>(null)

  const sendReminder = async (id: string) => {
    setSending(id)
    await new Promise((r) => setTimeout(r, 1500))
    setCarts((prev) => prev.map((c) => c.id === id ? { ...c, reminder: true } : c))
    setSending(null)
  }

  const sendAll = async () => {
    const toSend = carts.filter((c) => !c.reminder)
    for (const cart of toSend) {
      await sendReminder(cart.id)
    }
  }

  const notSent = carts.filter((c) => !c.reminder).length

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">עגלות נטושות</h1>
          <p className="text-sm text-gray-500">{carts.length} עגלות היום · {notSent} ממתינות לתזכורת</p>
        </div>
        {notSent > 0 && (
          <button
            onClick={sendAll}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            📨 שלח תזכורת לכולם ({notSent})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-orange-500">{carts.length}</p>
          <p className="text-xs text-gray-500 mt-1">עגלות נטושות היום</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-gray-900">
            ₪{(carts.reduce((s, c) => s + c.total, 0) / 100).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">פוטנציאל אבוד</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-green-600">{carts.filter((c) => c.reminder).length}</p>
          <p className="text-xs text-gray-500 mt-1">תזכורות נשלחו</p>
        </div>
      </div>

      <div className="space-y-3">
        {carts.map((cart) => (
          <div key={cart.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">🛒</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-semibold text-gray-900">{cart.name}</span>
                <span className="text-xs text-gray-400">{cart.time}</span>
                {cart.reminder && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">✅ נשלחה תזכורת</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>📧 {cart.email}</span>
                <span>📱 {cart.phone}</span>
                <span>🛍️ {cart.items.join(', ')}</span>
                <span className="font-bold text-gray-700">₪{(cart.total / 100).toFixed(0)}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!cart.reminder ? (
                <button
                  onClick={() => sendReminder(cart.id)}
                  disabled={sending === cart.id}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                >
                  {sending === cart.id ? (
                    <><span className="animate-spin">⟳</span> שולח...</>
                  ) : (
                    <>📨 שלח תזכורת</>
                  )}
                </button>
              ) : (
                <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">
                  נשלח ✓
                </button>
              )}
              <a href={`https://wa.me/${cart.phone.replace(/-/g, '').replace('0', '972')}`} target="_blank" rel="noreferrer"
                className="bg-green-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition-colors">
                💬
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
