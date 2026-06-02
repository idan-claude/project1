'use client'
import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DesignTokens {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  textSecondary: string
  borderColor: string
  buttonRadius: string
  cardRadius: string
  fontFamily: string
}

interface Section {
  id: string
  type: string
  enabled: boolean
  order: number
  settings: Record<string, string>
}

interface Theme {
  _id?: string
  storeId?: string
  tokens: DesignTokens
  logoUrl: string
  heroImageUrl: string
  sections: Section[]
  status: 'draft' | 'published'
  version?: number
}

// ─── Icons ────────────────────────────────────────────────────────────────────
type P = { className?: string }
function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || 'w-4 h-4'}>{children}</svg>
}
const IEye      = (p: P) => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>
const ISave     = (p: P) => <Svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Svg>
const IUpload   = (p: P) => <Svg {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></Svg>
const IChevronU = (p: P) => <Svg {...p}><polyline points="18 15 12 9 6 15"/></Svg>
const IChevronD = (p: P) => <Svg {...p}><polyline points="6 9 12 15 18 9"/></Svg>
const IToggleOn = (p: P) => <Svg {...p}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></Svg>
const IToggleOff = (p: P) => <Svg {...p}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="8" cy="12" r="3"/></Svg>

// ─── Section label map ────────────────────────────────────────────────────────
const SECTION_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  hero:         { label: 'כותרת ראשית',     emoji: '🖼️', desc: 'תמונה + כותרת + כפתור CTA' },
  benefits:     { label: 'יתרונות',          emoji: '✅', desc: 'רשימת יתרונות המוצר' },
  product:      { label: 'המוצר',            emoji: '📦', desc: 'תמונות, מחיר, כפתור הוסף לסל' },
  social_proof: { label: 'הוכחה חברתית',    emoji: '⭐', desc: 'מספרים, אמון, ביקורות' },
  features:     { label: 'מאפיינים',         emoji: '🔧', desc: 'תכונות מפורטות של המוצר' },
  faq:          { label: 'שאלות נפוצות',    emoji: '❓', desc: 'FAQ לפני רכישה' },
  guarantee:    { label: 'אחריות',           emoji: '🛡️', desc: 'מדיניות החזרה ואחריות' },
  urgency:      { label: 'דחיפות',          emoji: '⏰', desc: 'ספירה לאחור ומלאי מוגבל' },
  cta:          { label: 'קריאה לפעולה',   emoji: '🎯', desc: 'כפתור CTA ראשי' },
  reviews:      { label: 'ביקורות',          emoji: '💬', desc: 'ביקורות לקוחות' },
  footer:       { label: 'כותרת תחתונה',   emoji: '📝', desc: 'פרטי קשר ומדיניות' },
}

// ─── Color presets ────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { name: 'כחול', primary: '#3b82f6', secondary: '#1e40af', accent: '#f59e0b' },
  { name: 'ירוק',  primary: '#10b981', secondary: '#065f46', accent: '#f59e0b' },
  { name: 'סגול', primary: '#8b5cf6', secondary: '#4c1d95', accent: '#f59e0b' },
  { name: 'אדום',  primary: '#ef4444', secondary: '#991b1b', accent: '#fbbf24' },
  { name: 'כתום', primary: '#f97316', secondary: '#9a3412', accent: '#eab308' },
  { name: 'ורוד',  primary: '#ec4899', secondary: '#9d174d', accent: '#fbbf24' },
]

const FONTS = ['Rubik', 'Assistant', 'Heebo', 'Frank Ruhl Libre', 'Secular One', 'Varela Round']

const RADIUS_OPTIONS = [
  { label: 'ישר',     value: '0rem' },
  { label: 'עדין',    value: '0.375rem' },
  { label: 'רגיל',   value: '0.75rem' },
  { label: 'מעוגל',  value: '1.25rem' },
  { label: 'עגול',   value: '9999px' },
]

type Tab = 'colors' | 'typography' | 'layout' | 'sections'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorefrontEditorPage() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<Tab>('colors')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewOpen, setPreviewOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/storefront/theme')
      const d = await r.json()
      if (d.theme) setTheme(d.theme)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function setToken(key: keyof DesignTokens, value: string) {
    setTheme(prev => prev ? { ...prev, tokens: { ...prev.tokens, [key]: value } } : prev)
  }

  function applyPreset(preset: typeof COLOR_PRESETS[0]) {
    setTheme(prev => prev ? {
      ...prev,
      tokens: { ...prev.tokens, primaryColor: preset.primary, secondaryColor: preset.secondary, accentColor: preset.accent }
    } : prev)
  }

  function toggleSection(id: string) {
    setTheme(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    } : prev)
  }

  function moveSection(id: string, dir: -1 | 1) {
    setTheme(prev => {
      if (!prev) return prev
      const sorted = [...prev.sections].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(s => s.id === id)
      const swapIdx = idx + dir
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev
      const updated = [...sorted]
      const tmpOrder = updated[idx].order
      updated[idx] = { ...updated[idx], order: updated[swapIdx].order }
      updated[swapIdx] = { ...updated[swapIdx], order: tmpOrder }
      return { ...prev, sections: updated }
    })
  }

  async function save() {
    if (!theme) return
    setSaving(true)
    try {
      await fetch('/api/admin/storefront/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: theme.tokens, logoUrl: theme.logoUrl, heroImageUrl: theme.heroImageUrl, sections: theme.sections }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true)
    try {
      await save()
      await fetch('/api/admin/storefront/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })
      setTheme(prev => prev ? { ...prev, status: 'published' } : prev)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-7 bg-[#070B14] min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">טוען עורך...</p>
        </div>
      </div>
    )
  }

  if (!theme) return null

  const sortedSections = [...theme.sections].sort((a, b) => a.order - b.order)
  const fontQuery = FONTS.map(f => f.replace(/ /g, '+')).join('&family=')
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap&subset=hebrew`

  return (
    <div className="flex h-screen bg-[#070B14] overflow-hidden" dir="rtl">
      {/* Load Hebrew Google Fonts for preview */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontsUrl} />
      {/* Sidebar panel */}
      <div className="w-72 flex-shrink-0 bg-[#080C18] border-l border-white/[0.055] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/[0.055] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-bold text-white">עורך חנות</h1>
            <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${
              theme.status === 'published'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {theme.status === 'published' ? 'פורסם' : 'טיוטה'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1.5">
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#0E1629] border border-white/[0.055] text-gray-300 text-[11px] font-medium py-2 rounded-xl hover:bg-white/[0.07] transition-colors disabled:opacity-50">
              <ISave className="w-3 h-3" />
              {saved ? 'נשמר ✓' : saving ? 'שומר...' : 'שמור'}
            </button>
            <button onClick={() => setPreviewOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-[#0E1629] border border-white/[0.055] text-gray-300 text-[11px] font-medium px-3 py-2 rounded-xl hover:bg-white/[0.07] transition-colors">
              <IEye className="w-3 h-3" />
            </button>
            <button onClick={publish} disabled={publishing}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold py-2 rounded-xl transition-colors disabled:opacity-50">
              <IUpload className="w-3 h-3" />
              {publishing ? 'מפרסם...' : 'פרסם'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.055] flex-shrink-0">
          {([['colors','צבעים'],['typography','גופן'],['layout','מבנה'],['sections','סקציות']] as [Tab,string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-semibold transition-colors ${tab === t ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto admin-scroll p-4 space-y-5">

          {/* Colors tab */}
          {tab === 'colors' && (
            <>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">בחר סגנון מהיר</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {COLOR_PRESETS.map(preset => (
                    <button key={preset.name} onClick={() => applyPreset(preset)}
                      className="group relative rounded-xl border border-white/[0.055] p-2 hover:border-white/20 transition-all overflow-hidden">
                      <div className="flex gap-1 mb-1.5">
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: preset.primary }} />
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: preset.secondary }} />
                      </div>
                      <p className="text-[9px] text-gray-500">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'primaryColor',    label: 'צבע ראשי' },
                  { key: 'secondaryColor',  label: 'צבע משני' },
                  { key: 'accentColor',     label: 'צבע הדגשה' },
                  { key: 'backgroundColor', label: 'רקע' },
                  { key: 'surfaceColor',    label: 'משטחים' },
                  { key: 'textColor',       label: 'טקסט ראשי' },
                  { key: 'textSecondary',   label: 'טקסט משני' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <label className="text-[11px] text-gray-400 flex-1">{label}</label>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg border border-white/10 overflow-hidden">
                        <input
                          type="color"
                          value={theme.tokens[key as keyof DesignTokens]}
                          onChange={e => setToken(key as keyof DesignTokens, e.target.value)}
                          className="w-8 h-8 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                      <span className="text-[10px] text-gray-600 font-mono w-16 truncate">{theme.tokens[key as keyof DesignTokens]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Typography tab */}
          {tab === 'typography' && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">פונט</p>
                <div className="space-y-1.5">
                  {FONTS.map(font => (
                    <button key={font} onClick={() => setToken('fontFamily', font)}
                      className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-all border ${
                        theme.tokens.fontFamily === font
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          : 'bg-white/[0.03] border-white/[0.055] text-gray-400 hover:bg-white/[0.06]'
                      }`}
                      style={{ fontFamily: font }}>
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Layout tab */}
          {tab === 'layout' && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">עיגול פינות — כפתורים</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {RADIUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setToken('buttonRadius', opt.value)}
                      className={`py-2 text-[9px] font-medium transition-all border text-center ${
                        theme.tokens.buttonRadius === opt.value
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          : 'bg-white/[0.03] border-white/[0.055] text-gray-500 hover:bg-white/[0.06]'
                      }`}
                      style={{ borderRadius: opt.value }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">עיגול פינות — קארדים</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {RADIUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setToken('cardRadius', opt.value)}
                      className={`py-2 text-[9px] font-medium transition-all border text-center ${
                        theme.tokens.cardRadius === opt.value
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          : 'bg-white/[0.03] border-white/[0.055] text-gray-500 hover:bg-white/[0.06]'
                      }`}
                      style={{ borderRadius: opt.value }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sections tab */}
          {tab === 'sections' && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">סדר ועריכת סקציות</p>
              <div className="space-y-1.5">
                {sortedSections.map((section, idx) => {
                  const meta = SECTION_LABELS[section.type] ?? { label: section.type, emoji: '📌', desc: '' }
                  return (
                    <div key={section.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        section.enabled
                          ? 'bg-[#0E1629] border-white/[0.055]'
                          : 'bg-white/[0.02] border-white/[0.03] opacity-50'
                      }`}>
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button onClick={() => moveSection(section.id, -1)} disabled={idx === 0}
                          className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                          <IChevronU className="w-2.5 h-2.5" />
                        </button>
                        <button onClick={() => moveSection(section.id, 1)} disabled={idx === sortedSections.length - 1}
                          className="p-0.5 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors">
                          <IChevronD className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <span className="text-base flex-shrink-0">{meta.emoji}</span>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white truncate">{meta.label}</p>
                        <p className="text-[9px] text-gray-600 truncate">{meta.desc}</p>
                      </div>

                      {/* Toggle */}
                      <button onClick={() => toggleSection(section.id)}
                        className={`flex-shrink-0 transition-colors ${section.enabled ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {section.enabled ? <IToggleOn className="w-5 h-5" /> : <IToggleOff className="w-5 h-5" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview toolbar */}
        <div className="flex-shrink-0 bg-[#0E1629] border-b border-white/[0.055] px-4 py-2.5 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">תצוגה מקדימה</p>
          <div className="flex items-center gap-1">
            {(['desktop','tablet','mobile'] as const).map(device => (
              <button key={device} onClick={() => setPreviewDevice(device)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  previewDevice === device ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}>
                {device === 'desktop' ? 'מחשב' : device === 'tablet' ? 'טאבלט' : 'מובייל'}
              </button>
            ))}
          </div>
        </div>

        {/* Preview frame */}
        <div className="flex-1 overflow-auto bg-[#060A12] flex items-center justify-center p-6">
          <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            previewDevice === 'desktop' ? 'w-full max-w-5xl' :
            previewDevice === 'tablet'  ? 'w-[768px]' :
            'w-[390px]'
          }`} style={{ minHeight: '600px' }}>
            {/* Preview content — live design tokens */}
            <div style={{
              background: theme.tokens.backgroundColor,
              color: theme.tokens.textColor,
              fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif`,
            }}>
              {/* Hero preview */}
              <div style={{ background: theme.tokens.primaryColor, padding: '3rem 2rem', textAlign: 'center', direction: 'rtl' }}>
                <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif` }}>
                  {theme.tokens.fontFamily !== 'Rubik' ? `${theme.tokens.fontFamily} —` : ''} הכותרת של החנות שלך
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                  תיאור קצר שמסביר מה אתה מוכר ולמה לקנות אצלך
                </p>
                <button style={{
                  background: theme.tokens.accentColor,
                  color: '#000',
                  border: 'none',
                  borderRadius: theme.tokens.buttonRadius,
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif`,
                }}>
                  הזמן עכשיו
                </button>
              </div>

              {/* Surface preview */}
              <div style={{ background: theme.tokens.surfaceColor, padding: '2rem', direction: 'rtl' }}>
                <div style={{ display: 'grid', gridTemplateColumns: previewDevice === 'mobile' ? '1fr' : 'repeat(3,1fr)', gap: '1rem' }}>
                  {['יתרון ראשון', 'יתרון שני', 'יתרון שלישי'].map((label, i) => (
                    <div key={i} style={{
                      background: theme.tokens.backgroundColor,
                      border: `1px solid ${theme.tokens.borderColor}`,
                      borderRadius: theme.tokens.cardRadius,
                      padding: '1.25rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                      <p style={{ fontWeight: 700, marginBottom: '0.25rem', color: theme.tokens.textColor, fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif` }}>{label}</p>
                      <p style={{ fontSize: '0.875rem', color: theme.tokens.textSecondary }}>תיאור קצר של היתרון</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA preview */}
              <div style={{ padding: '2rem', textAlign: 'center', direction: 'rtl', borderTop: `1px solid ${theme.tokens.borderColor}` }}>
                <button style={{
                  background: theme.tokens.primaryColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: theme.tokens.buttonRadius,
                  padding: '1rem 3rem',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: previewDevice === 'mobile' ? '100%' : 'auto',
                  fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif`,
                }}>
                  לרכישה מיידית ←
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
