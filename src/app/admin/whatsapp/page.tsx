'use client'
import { useState } from 'react'

const WA_NUMBER = '9720525884463'

const TEMPLATES = [
  {
    id: 'order_confirm',
    name: 'אישור הזמנה',
    text: 'שלום {name}! 🎉 הזמנתך #{orderNumber} התקבלה בהצלחה. FindCard PRO שלך בדרך אליך! למעקב: {trackingUrl}',
  },
  {
    id: 'abandoned_cart',
    name: 'תזכורת עגלה נטושה',
    text: 'היי {name}! שכחת משהו בעגלה 🛒 FindCard PRO עדיין מחכה לך. לסיום הרכישה: {cartUrl} — יש לנו מלאי מוגבל!',
  },
  {
    id: 'shipping',
    name: 'עדכון משלוח',
    text: 'שלום {name}! 📦 הזמנתך #{orderNumber} יצאה לדרך! מספר מעקב: {tracking}. צפי הגעה: 7-14 ימי עסקים.',
  },
  {
    id: 'review_request',
    name: 'בקשת ביקורת',
    text: 'שלום {name}! 😊 קיבלת את הFindCard? נשמח לדעת מה דעתך! שנייה לביקורת: {reviewUrl} — תודה רבה!',
  },
]

export default function WhatsAppPage() {
  const [selected, setSelected] = useState(TEMPLATES[0])
  const [customText, setCustomText] = useState(TEMPLATES[0].text)

  const openWA = () => {
    const msg = encodeURIComponent(
      customText
        .replace(/{name}/g, 'לקוח')
        .replace(/{orderNumber}/g, 'ORD-001')
        .replace(/{trackingUrl}/g, 'https://project1-flame-phi.vercel.app/track')
        .replace(/{cartUrl}/g, 'https://project1-flame-phi.vercel.app/product')
        .replace(/{tracking}/g, 'IL123456789')
        .replace(/{reviewUrl}/g, 'https://project1-flame-phi.vercel.app/product')
    )
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">וואטסאפ</h1>
          <p className="text-sm text-gray-500">ניהול תבניות הודעות ללקוחות</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <span className="text-green-600">📱</span>
          <span className="text-sm font-bold text-green-700">+{WA_NUMBER}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">תבניות הודעה</h2>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setSelected(t); setCustomText(t.text) }}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  selected.id === t.id ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">עריכת הודעה: {selected.name}</h2>
          <textarea value={customText} onChange={e => setCustomText(e.target.value)} rows={5}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3" />
          <p className="text-xs text-gray-400 mb-4">
            משתנים: {'{name}'}, {'{orderNumber}'}, {'{trackingUrl}'}, {'{cartUrl}'}, {'{tracking}'}, {'{reviewUrl}'}
          </p>

          <div className="bg-[#ECE5DD] rounded-xl p-4 mb-4">
            <div className="bg-white rounded-xl rounded-tr-sm px-4 py-3 max-w-xs shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {customText
                  .replace(/{name}/g, 'דוגמה')
                  .replace(/{orderNumber}/g, 'ORD-042')
                  .replace(/{trackingUrl}/g, 'findcard.co.il/track')
                  .replace(/{cartUrl}/g, 'findcard.co.il/product')
                  .replace(/{tracking}/g, 'IL123456789')
                  .replace(/{reviewUrl}/g, 'findcard.co.il/product')}
              </p>
              <p className="text-xs text-gray-400 text-left mt-1">14:32 ✓✓</p>
            </div>
          </div>

          <button onClick={openWA}
            className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20BD5A] transition-colors flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.604L0 24l6.545-1.371A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.683-.506-5.215-1.385l-.374-.22-3.882.813.826-3.79-.241-.389A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            פתח בוואטסאפ
          </button>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <h3 className="font-bold text-blue-800 mb-2">היסטוריית הודעות</h3>
        <p className="text-sm text-blue-600">הודעות שנשלחו ידנית דרך WhatsApp Web יופיעו בהיסטוריה של הטלפון שלך. שליחה אוטומטית דרך Twilio API תתווסף כאן בקרוב.</p>
      </div>
    </div>
  )
}
