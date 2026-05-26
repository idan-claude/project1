'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { SectionType } from '@/lib/db/models/PageLayout'

interface Section {
  type: SectionType
  enabled: boolean
  order: number
  config: Record<string, unknown>
}

const SECTION_META: Record<SectionType, { label: string; icon: string; desc: string }> = {
  hero:         { label: 'גיבור — תמונה + כותרת', icon: '🏠', desc: 'תמונת המוצר, שם, כותרת משנה, כוכבים' },
  urgency:      { label: 'בר דחיפות', icon: '🔥', desc: 'טקסט "מבצע מוגבל" מעל כפתור הקנייה' },
  bundles:      { label: 'בחר חבילה', icon: '📦', desc: 'סלקטור חבילות + כפתורי CTA' },
  trust:        { label: 'אייקוני אמון', icon: '🛡️', desc: 'משלוח / אחריות / SSL — מתחת לכפתורים' },
  guarantee:    { label: 'אחריות', icon: '✅', desc: 'בלוק אחריות + ביטחון בקנייה' },
  shipping:     { label: 'משלוח', icon: '🚚', desc: 'מידע זמן ושיטת משלוח' },
  benefits:     { label: 'יתרונות (Feature Grid)', icon: '⭐', desc: 'גריד 6 אייקונים "למה FindCard?"' },
  reviews:      { label: 'ביקורות', icon: '💬', desc: 'קרוסלה + גריד ביקורות לקוחות' },
  faq:          { label: 'שאלות נפוצות', icon: '❓', desc: 'אקורדיון שאלות/תשובות' },
  video:        { label: 'סרטון', icon: '▶️', desc: 'YouTube/Vimeo embed' },
  before_after: { label: 'לפני ואחרי', icon: '🔄', desc: 'גלריית השוואה' },
  custom_text:  { label: 'טקסט חופשי', icon: '📝', desc: 'בלוק HTML/טקסט מותאם' },
}

export default function LayoutEditorPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasCustomLayout, setHasCustomLayout] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    fetch(`/api/admin/products/${productId}/layout`)
      .then(r => r.json())
      .then(d => {
        setSections(d.sections || [])
        setHasCustomLayout(d.hasCustomLayout)
        setLoading(false)
      })
  }, [productId])

  const autoSave = useCallback((newSections: Section[]) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await fetch(`/api/admin/products/${productId}/layout`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sections: newSections }),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } finally {
        setSaving(false)
      }
    }, 500)
  }, [productId])

  function toggleSection(i: number) {
    const next = sections.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s)
    setSections(next)
    autoSave(next)
  }

  function handleDragStart(i: number) { setDragIdx(i) }
  function handleDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDragOver(i) }
  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setDragOver(null); return }
    const next = [...sections]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    const reordered = next.map((s, i) => ({ ...s, order: i }))
    setSections(reordered)
    setDragIdx(null)
    setDragOver(null)
    autoSave(reordered)
  }
  function handleDragEnd() { setDragIdx(null); setDragOver(null) }

  async function resetToDefault() {
    if (!confirm('איפוס לברירת מחדל? כל השינויים ימחקו')) return
    const res = await fetch(`/api/admin/products/${productId}/layout`, { method: 'DELETE' })
    const d = await res.json()
    setSections(d.sections)
    setHasCustomLayout(false)
  }

  function moveUp(i: number) {
    if (i === 0) return
    const next = [...sections]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    const reordered = next.map((s, j) => ({ ...s, order: j }))
    setSections(reordered)
    autoSave(reordered)
  }

  function moveDown(i: number) {
    if (i === sections.length - 1) return
    const next = [...sections]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    const reordered = next.map((s, j) => ({ ...s, order: j }))
    setSections(reordered)
    autoSave(reordered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C16] flex items-center justify-center">
        <div className="text-white text-sm">טוען עורך עמוד...</div>
      </div>
    )
  }

  const enabledCount = sections.filter(s => s.enabled).length

  return (
    <div className="min-h-screen bg-[#080C16]" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-300 text-sm mb-1 flex items-center gap-1">← חזרה לעריכת מוצר</button>
            <h1 className="text-xl font-bold text-white">עורך מבנה עמוד</h1>
            <p className="text-xs text-gray-500 mt-0.5">{enabledCount} מתוך {sections.length} סקציות פעילות</p>
          </div>
          <div className="flex items-center gap-2">
            {hasCustomLayout && (
              <button onClick={resetToDefault} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                איפוס לברירת מחדל
              </button>
            )}
            {saving && <span className="text-xs text-gray-500">שומר...</span>}
            {saved && !saving && <span className="text-xs text-emerald-400">✓ נשמר</span>}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-5 text-xs text-blue-300">
          <p className="font-semibold mb-1">כיצד לעשות שימוש:</p>
          <ul className="space-y-0.5 text-blue-300/80">
            <li>• גרור ⠿ לשינוי סדר הסקציות בעמוד</li>
            <li>• לחץ על הטוגל להפעלה/כיבוי של סקציה</li>
            <li>• השינויים נשמרים אוטומטית תוך 0.5 שניות</li>
            <li>• הסדר משפיע על המוצר בחנות בזמן אמת</li>
          </ul>
        </div>

        {/* Section list */}
        <div className="space-y-2">
          {sections.map((section, i) => {
            const meta = SECTION_META[section.type]
            const isDragging = dragIdx === i
            const isOver = dragOver === i

            return (
              <div
                key={`${section.type}-${i}`}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-3 bg-[#0E1525] border rounded-2xl px-4 py-3.5 transition-all cursor-grab active:cursor-grabbing select-none
                  ${isDragging ? 'opacity-40 scale-95 border-blue-500/50' : ''}
                  ${isOver && !isDragging ? 'border-blue-500/60 bg-blue-500/10 scale-[1.01]' : ''}
                  ${!isDragging && !isOver ? (section.enabled ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-50') : ''}
                `}
              >
                {/* Drag handle */}
                <div className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 cursor-grab text-lg leading-none">⠿</div>

                {/* Icon */}
                <span className="text-xl flex-shrink-0">{meta.icon}</span>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${section.enabled ? 'text-white' : 'text-gray-600'}`}>{meta.label}</p>
                  <p className="text-xs text-gray-600 truncate">{meta.desc}</p>
                </div>

                {/* Order buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-gray-400 text-xs flex items-center justify-center transition-colors">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveDown(i)} disabled={i === sections.length - 1}
                    className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-gray-400 text-xs flex items-center justify-center transition-colors">
                    ↓
                  </button>
                </div>

                {/* Order badge */}
                <span className="text-xs text-gray-700 font-mono w-6 text-center flex-shrink-0">{i + 1}</span>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleSection(i)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${section.enabled ? 'bg-emerald-600' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${section.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Preview link */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
          <a
            href={`/product?preview=layout`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
          >
            👁️ תצוגה מקדימה של העמוד ←
          </a>
          <p className="text-xs text-gray-600">השינויים נכנסים לתוקף בעמוד המוצר מיד</p>
        </div>
      </div>
    </div>
  )
}
