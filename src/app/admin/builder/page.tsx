'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Method = 'url' | 'aliexpress' | 'manual' | null
type Phase = 'choose' | 'input' | 'extracting' | 'extracted' | 'generating' | 'done' | 'error'

interface ExtractedProduct {
  title: string
  description: string
  images: string[]
  price: number | null
  currency: string
  rating: number | null
  reviewCount: number | null
  sourcePlatform: string
  sourceUrl: string
}

type P = { className?: string }
function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>{children}</svg>
}
const ILink  = (p: P) => <Svg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>
const IZap   = (p: P) => <Svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Svg>
const IPen   = (p: P) => <Svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Svg>
const ICheck = (p: P) => <Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>
const IArrow = (p: P) => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>

const METHODS = [
  {
    id: 'aliexpress' as Method,
    label: 'AliExpress',
    emoji: '🛒',
    desc: 'הדבק קישור מוצר מ-AliExpress',
    detail: 'הדבק קישור ל-AI ייחלץ שם, תמונות, מחיר ותיאור',
  },
  {
    id: 'url' as Method,
    label: 'כל URL של מוצר',
    emoji: '🔗',
    desc: 'כל דף מוצר באינטרנט',
    detail: 'Amazon, Etsy, Zara, AliExpress ועוד',
  },
  {
    id: 'manual' as Method,
    label: 'הזנה ידנית',
    emoji: '✏️',
    desc: 'הזן פרטים ידנית',
    detail: 'שם מוצר, תיאור, מחיר — ה-AI יכתוב את שאר התוכן',
  },
]

export default function BuilderPage() {
  const router = useRouter()
  const [method, setMethod] = useState<Method>(null)
  const [phase, setPhase] = useState<Phase>('choose')
  const [url, setUrl] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualPrice, setManualPrice] = useState('')
  const [extracted, setExtracted] = useState<ExtractedProduct | null>(null)
  const [error, setError] = useState('')
  const [createdId, setCreatedId] = useState<string | null>(null)

  function selectMethod(m: Method) {
    setMethod(m)
    setPhase('input')
    setError('')
  }

  async function extract() {
    if (!url.trim()) { setError('נא להזין URL'); return }
    setPhase('extracting')
    setError('')
    try {
      const r = await fetch('/api/admin/builder/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'שגיאה'); setPhase('input'); return }
      setExtracted(d.product)
      setPhase('extracted')
    } catch {
      setError('שגיאת רשת — נסה שוב')
      setPhase('input')
    }
  }

  async function generate(product?: ExtractedProduct) {
    const productData = product ?? (method === 'manual' ? {
      title: manualTitle,
      titleEn: manualTitle,
      description: manualDesc,
      images: [],
      price: manualPrice ? parseFloat(manualPrice) : null,
      currency: 'ILS',
      rating: null,
      reviewCount: null,
      variants: [],
      specs: [],
      sourceUrl: '',
      sourcePlatform: 'manual' as const,
    } : extracted)

    if (!productData) return
    setPhase('generating')
    setError('')
    try {
      const r = await fetch('/api/admin/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productData }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error || 'שגיאה'); setPhase('extracted'); return }
      setCreatedId(d.product._id)
      setPhase('done')
    } catch {
      setError('שגיאת רשת — נסה שוב')
      setPhase('extracted')
    }
  }

  return (
    <div className="p-5 md:p-7 bg-[#070B14] min-h-screen" dir="rtl">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin" className="text-[11px] text-gray-600 hover:text-gray-400">לוח בקרה</Link>
          <span className="text-gray-700">/</span>
          <span className="text-[11px] text-gray-400">בונה מוצרים</span>
        </div>
        <h1 className="text-xl font-bold text-white">בונה מוצרים AI</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">הוסף מוצר חדש — AI יכתוב את כל התוכן אוטומטית</p>
      </div>

      {/* Phase: choose method */}
      {phase === 'choose' && (
        <div className="max-w-xl space-y-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4">בחר כיצד להוסיף מוצר:</p>
          {METHODS.map(m => (
            <button key={m.id} onClick={() => selectMethod(m.id)}
              className="w-full bg-[#0E1629] border border-white/[0.055] rounded-2xl p-4 hover:border-blue-500/30 hover:bg-[#111D38] transition-all group text-right flex items-start gap-4">
              <div className="w-12 h-12 bg-white/[0.04] rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-blue-500/10 transition-colors">
                {m.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white mb-0.5">{m.label}</p>
                <p className="text-[11px] text-gray-500">{m.desc}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{m.detail}</p>
              </div>
              <IArrow className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}

      {/* Phase: input URL */}
      {phase === 'input' && (method === 'url' || method === 'aliexpress') && (
        <div className="max-w-xl">
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-3">
              {method === 'aliexpress' ? '🛒 הדבק קישור AliExpress' : '🔗 הדבק קישור מוצר'}
            </p>
            <div className="space-y-3">
              <div>
                <input
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError('') }}
                  placeholder={method === 'aliexpress' ? 'https://www.aliexpress.com/item/...' : 'https://...'}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && extract()}
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                  dir="ltr"
                />
                {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPhase('choose'); setError('') }}
                  className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">
                  חזור
                </button>
                <button onClick={extract}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  <IZap className="w-4 h-4" />
                  חלץ מידע
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase: manual input */}
      {phase === 'input' && method === 'manual' && (
        <div className="max-w-xl">
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5 space-y-4">
            <p className="text-sm font-bold text-white">✏️ פרטי המוצר</p>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">שם המוצר *</label>
              <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="לדוגמה: שמפו לשיער יבש" autoFocus
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">תיאור קצר (אופציונלי)</label>
              <textarea value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="מה המוצר עושה, למי הוא מתאים..." rows={3}
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">מחיר ב-₪ (אופציונלי)</label>
              <input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="99"
                className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
            {error && <p className="text-red-400 text-[11px]">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setPhase('choose'); setError('') }}
                className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl">חזור</button>
              <button onClick={() => generate()}  disabled={!manualTitle.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                <IZap className="w-4 h-4" />
                צור תוכן AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase: extracting */}
      {phase === 'extracting' && (
        <div className="max-w-xl">
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
            <p className="text-white font-semibold mb-1">מחלץ מידע מהדף...</p>
            <p className="text-gray-500 text-sm">קורא את דף המוצר ומחלץ שם, תמונות ומחיר</p>
          </div>
        </div>
      )}

      {/* Phase: extracted */}
      {phase === 'extracted' && extracted && (
        <div className="max-w-xl space-y-4">
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <ICheck className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-white">מידע חולץ בהצלחה</p>
            </div>

            <div className="space-y-3">
              {extracted.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={extracted.images[0]} alt={extracted.title} className="w-full h-48 object-cover rounded-xl" />
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">שם</span>
                  <span className="text-white font-medium text-right flex-1 mr-4 truncate">{extracted.title}</span>
                </div>
                {extracted.price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">מחיר מקור</span>
                    <span className="text-white">{extracted.price} {extracted.currency}</span>
                  </div>
                )}
                {extracted.rating && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">דירוג</span>
                    <span className="text-white">⭐ {extracted.rating} ({extracted.reviewCount?.toLocaleString()})</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">תמונות</span>
                  <span className="text-white">{extracted.images.length} תמונות</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <p className="text-red-400 text-[12px]">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => { setPhase('input'); setExtracted(null) }}
              className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium rounded-xl hover:bg-white/[0.07]">
              חזור
            </button>
            <button onClick={() => generate(extracted)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              <IZap className="w-4 h-4" />
              צור דף מוצר עם AI ←
            </button>
          </div>
        </div>
      )}

      {/* Phase: generating */}
      {phase === 'generating' && (
        <div className="max-w-xl">
          <div className="bg-[#0E1629] border border-white/[0.055] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
              <IZap className="w-7 h-7 text-blue-400 animate-pulse" />
            </div>
            <p className="text-white font-semibold mb-1">AI כותב את דף המוצר...</p>
            <p className="text-gray-500 text-sm">כותרת, תיאור, יתרונות, FAQs, מחיר מוצע</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase: done */}
      {phase === 'done' && createdId && (
        <div className="max-w-xl">
          <div className="bg-[#0E1629] border border-emerald-500/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
              <ICheck className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white text-lg font-bold mb-1">המוצר נוצר בהצלחה!</p>
            <p className="text-gray-500 text-sm mb-5">AI יצר כותרת, תיאור, יתרונות, FAQ ומחיר מוצע</p>
            <div className="flex gap-2">
              <button onClick={() => { setPhase('choose'); setMethod(null); setUrl(''); setExtracted(null); setCreatedId(null) }}
                className="flex-1 bg-white/[0.04] border border-white/[0.055] text-gray-400 text-sm font-medium py-2.5 rounded-xl hover:bg-white/[0.07]">
                הוסף מוצר נוסף
              </button>
              <button onClick={() => router.push(`/admin/products/${createdId}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                <IPen className="w-4 h-4" />
                ערוך מוצר ←
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info bar */}
      <div className="max-w-xl mt-6 bg-[#0E1629] border border-white/[0.055] rounded-xl px-4 py-3 flex items-start gap-2">
        <ILink className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-500">
          ה-AI מייצר תוכן שיווקי בעברית. כל הפרטים ניתנים לעריכה לאחר היצירה.
        </p>
      </div>
    </div>
  )
}
