'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DesignTokens {
  primaryColor: string; secondaryColor: string; accentColor: string
  backgroundColor: string; surfaceColor: string; textColor: string
  textSecondary: string; borderColor: string; buttonRadius: string
  cardRadius: string; fontFamily: string; fontSize: string; spacing: string
  headingSize: string; fontWeight: string; lineHeight: string
  shadowIntensity: string; containerWidth: string; animationIntensity: string
}

interface HeaderConfig {
  announcementEnabled: boolean; announcementText: string; announcementBg: string
  stickyHeader: boolean; ctaText: string; ctaEnabled: boolean; phone: string; whatsapp: string
}

interface FooterConfig {
  tagline: string; instagramUrl: string; tiktokUrl: string; whatsappUrl: string
  facebookUrl: string; contactEmail: string; contactPhone: string; copyright: string
  showPaymentIcons: boolean; showTrustBadges: boolean
}

interface CheckoutConfig {
  showSslBadge: boolean; showGuaranteeBadge: boolean; showReturnBadge: boolean; showShippingBadge: boolean
  guaranteeText: string; returnText: string; shippingText: string; showPaymentIcons: boolean; securityText: string
}

interface BenefitItem { emoji: string; text: string }
interface Section { id: string; type: string; enabled: boolean; order: number; settings: Record<string, unknown> }

interface Theme {
  _id?: string; storeId?: string; tokens: DesignTokens; logoUrl: string; faviconUrl: string
  heroImageUrl: string; headerConfig: HeaderConfig; footerConfig: FooterConfig; checkoutConfig: CheckoutConfig
  sections: Section[]; customCss: string; status: 'draft' | 'published'; version?: number
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
const ICode     = (p: P) => <Svg {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Svg>
const IHash     = (p: P) => <Svg {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></Svg>

const SECTION_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  hero:         { label: 'כותרת ראשית', emoji: '🖼️', desc: 'תמונה + כותרת + כפתור' },
  benefits:     { label: 'יתרונות',     emoji: '✅', desc: 'רשימת יתרונות' },
  product:      { label: 'המוצר',       emoji: '📦', desc: 'תמונות, מחיר, סל' },
  social_proof: { label: 'אמינות',      emoji: '⭐', desc: 'מספרים, ביקורות' },
  features:     { label: 'מאפיינים',    emoji: '🔧', desc: 'תכונות מפורטות' },
  faq:          { label: "שו\"ב",       emoji: '❓', desc: 'שאלות נפוצות' },
  guarantee:    { label: 'אחריות',      emoji: '🛡️', desc: 'מדיניות החזרה' },
  urgency:      { label: 'דחיפות',      emoji: '⏰', desc: 'ספירה לאחור' },
  cta:          { label: 'קריאה לפעולה',emoji: '🎯', desc: 'כפתור CTA ראשי' },
  reviews:      { label: 'ביקורות',     emoji: '💬', desc: 'ביקורות לקוחות' },
  footer:       { label: 'כותרת תחתונה',emoji: '📝', desc: 'פרטי קשר' },
}

const COLOR_PRESETS = [
  { name: 'כחול',  primary: '#3b82f6', secondary: '#1e40af', accent: '#f59e0b' },
  { name: 'ירוק',  primary: '#10b981', secondary: '#065f46', accent: '#f59e0b' },
  { name: 'סגול',  primary: '#8b5cf6', secondary: '#4c1d95', accent: '#f59e0b' },
  { name: 'אדום',  primary: '#ef4444', secondary: '#991b1b', accent: '#fbbf24' },
  { name: 'כתום',  primary: '#f97316', secondary: '#9a3412', accent: '#eab308' },
  { name: 'ורוד',  primary: '#ec4899', secondary: '#9d174d', accent: '#fbbf24' },
  { name: 'טיל',   primary: '#0ea5e9', secondary: '#0c4a6e', accent: '#fb923c' },
  { name: 'ליים',  primary: '#84cc16', secondary: '#365314', accent: '#f97316' },
]

const FONTS = ['Rubik', 'Assistant', 'Heebo', 'Frank Ruhl Libre', 'Secular One', 'Varela Round']

const RADIUS_OPTIONS = [
  { label: 'ישר',   value: '0rem' },
  { label: 'עדין',  value: '0.375rem' },
  { label: 'רגיל',  value: '0.75rem' },
  { label: 'מעוגל', value: '1.25rem' },
  { label: 'עגול',  value: '9999px' },
]

type Tab = 'colors' | 'brand' | 'typography' | 'layout' | 'header' | 'footer' | 'checkout' | 'sections' | 'advanced'

const TABS: { id: Tab; label: string }[] = [
  { id: 'colors',     label: 'צבעים' },
  { id: 'brand',      label: 'מיתוג' },
  { id: 'typography', label: 'גופן' },
  { id: 'layout',     label: 'מבנה' },
  { id: 'header',     label: 'כותרת' },
  { id: 'footer',     label: 'פוטר' },
  { id: 'checkout',   label: 'צ\'קאאוט' },
  { id: 'sections',   label: 'סקציות' },
  { id: 'advanced',   label: 'מתקדם' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`flex-shrink-0 transition-colors ${on ? 'text-emerald-400' : 'text-gray-600'}`}>
      {on ? <IToggleOn className="w-5 h-5" /> : <IToggleOff className="w-5 h-5" />}
    </button>
  )
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-gray-600 mt-0.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-[#070B14] border border-white/[0.055] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors" />
  )
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-[#070B14] border border-white/[0.055] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors resize-none leading-relaxed" />
  )
}

function OptionPills({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
            value === opt.value ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.03] border-white/[0.055] text-gray-500 hover:bg-white/[0.06]'
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StorefrontEditorPage() {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<Tab>('colors')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [logoUploading, setLogoUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/storefront/theme')
      const d = await r.json()
      if (d.theme) setTheme(d.theme)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function setToken(key: keyof DesignTokens, value: string) {
    setTheme(prev => prev ? { ...prev, tokens: { ...prev.tokens, [key]: value } } : prev)
  }

  function setHeader(key: keyof HeaderConfig, value: string | boolean) {
    setTheme(prev => prev ? { ...prev, headerConfig: { ...prev.headerConfig, [key]: value } } : prev)
  }

  function setFooter(key: keyof FooterConfig, value: string | boolean) {
    setTheme(prev => prev ? { ...prev, footerConfig: { ...prev.footerConfig, [key]: value } } : prev)
  }

  function setCheckout(key: keyof CheckoutConfig, value: string | boolean) {
    setTheme(prev => prev ? { ...prev, checkoutConfig: { ...prev.checkoutConfig, [key]: value } } : prev)
  }

  function applyPreset(preset: typeof COLOR_PRESETS[0]) {
    setTheme(prev => prev ? { ...prev, tokens: { ...prev.tokens, primaryColor: preset.primary, secondaryColor: preset.secondary, accentColor: preset.accent } } : prev)
  }

  function setSectionSetting(id: string, key: string, value: unknown) {
    setTheme(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, settings: { ...s.settings, [key]: value } } : s)
    } : prev)
  }

  function getBenefitItems(section: Section): BenefitItem[] {
    const items = section.settings.items
    if (Array.isArray(items)) return items as BenefitItem[]
    return []
  }

  function setBenefitItem(sectionId: string, idx: number, key: 'emoji' | 'text', value: string) {
    setTheme(prev => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id !== sectionId) return s
          const items = [...getBenefitItems(s)]
          items[idx] = { ...items[idx], [key]: value }
          return { ...s, settings: { ...s.settings, items } }
        }),
      }
    })
  }

  function addBenefitItem(sectionId: string) {
    setTheme(prev => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id !== sectionId) return s
          const items = [...getBenefitItems(s), { emoji: '✅', text: '' }]
          return { ...s, settings: { ...s.settings, items } }
        }),
      }
    })
  }

  function removeBenefitItem(sectionId: string, idx: number) {
    setTheme(prev => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id !== sectionId) return s
          const items = getBenefitItems(s).filter((_, i) => i !== idx)
          return { ...s, settings: { ...s.settings, items } }
        }),
      }
    })
  }

  function toggleSection(id: string) {
    setTheme(prev => prev ? { ...prev, sections: prev.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s) } : prev)
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

  async function uploadImage(file: File, field: 'logoUrl' | 'heroImageUrl' | 'faviconUrl') {
    const setters = { logoUrl: setLogoUploading, heroImageUrl: setHeroUploading, faviconUrl: setFaviconUploading }
    setters[field](true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) setUploadError(d.error || 'שגיאה בהעלאה')
      else setTheme(prev => prev ? { ...prev, [field]: d.url } : prev)
    } catch { setUploadError('שגיאה בהעלאה') }
    finally { setters[field](false) }
  }

  async function save() {
    if (!theme) return
    setSaving(true)
    try {
      await fetch('/api/admin/storefront/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: theme.tokens, logoUrl: theme.logoUrl, faviconUrl: theme.faviconUrl,
          heroImageUrl: theme.heroImageUrl, headerConfig: theme.headerConfig,
          footerConfig: theme.footerConfig, sections: theme.sections, customCss: theme.customCss,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  async function publish() {
    setPublishing(true)
    try {
      await save()
      await fetch('/api/admin/storefront/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish' }) })
      setTheme(prev => prev ? { ...prev, status: 'published' } : prev)
    } finally { setPublishing(false) }
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

  const heroSection     = theme.sections.find(s => s.id === 'hero')
  const benefitsSection = theme.sections.find(s => s.id === 'benefits')
  const previewHeadline    = (heroSection?.settings?.headline    as string) || 'הכותרת של החנות שלך'
  const previewSubheadline = (heroSection?.settings?.subheadline as string) || 'תיאור קצר שמסביר מה אתה מוכר'
  const previewCtaText     = (heroSection?.settings?.ctaText     as string) || theme.headerConfig.ctaText || 'הזמן עכשיו'
  const previewBenefits    = (benefitsSection?.settings?.items   as BenefitItem[]) || [
    { emoji: '✅', text: 'יתרון ראשון' }, { emoji: '🚚', text: 'יתרון שני' }, { emoji: '🛡️', text: 'יתרון שלישי' },
  ]

  return (
    <div className="flex h-screen bg-[#070B14] overflow-hidden" dir="rtl">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={googleFontsUrl} />

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-[#080C18] border-l border-white/[0.055] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 py-4 border-b border-white/[0.055] flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-bold text-white">עורך חנות</h1>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${
                theme.status === 'published'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {theme.status === 'published' ? 'פורסם' : 'טיוטה'}
              </span>
              {theme.version && <span className="text-[9px] text-gray-600">v{theme.version}</span>}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#0E1629] border border-white/[0.055] text-gray-300 text-[11px] font-medium py-2 rounded-xl hover:bg-white/[0.07] transition-colors disabled:opacity-50">
              <ISave className="w-3 h-3" />
              {saved ? 'נשמר ✓' : saving ? 'שומר...' : 'שמור'}
            </button>
            <button onClick={publish} disabled={publishing}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold py-2 rounded-xl transition-colors disabled:opacity-50">
              <IUpload className="w-3 h-3" />
              {publishing ? 'מפרסם...' : 'פרסם'}
            </button>
          </div>
        </div>

        {/* Tab bar — horizontally scrollable */}
        <div ref={tabBarRef} className="flex border-b border-white/[0.055] flex-shrink-0 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-shrink-0 px-3 py-2.5 text-[10px] font-semibold transition-colors whitespace-nowrap ${tab === id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto admin-scroll p-4 space-y-5">

          {/* ── COLORS ─────────────────────────────────────── */}
          {tab === 'colors' && (
            <>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">ערכת צבעים מהירה</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLOR_PRESETS.map(preset => (
                    <button key={preset.name} onClick={() => applyPreset(preset)}
                      className="group relative rounded-xl border border-white/[0.055] p-2 hover:border-white/20 transition-all overflow-hidden">
                      <div className="flex gap-1 mb-1">
                        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: preset.primary }} />
                        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: preset.accent }} />
                      </div>
                      <p className="text-[9px] text-gray-500">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {([
                  { key: 'primaryColor',    label: 'צבע ראשי' },
                  { key: 'secondaryColor',  label: 'צבע משני' },
                  { key: 'accentColor',     label: 'הדגשה' },
                  { key: 'backgroundColor', label: 'רקע' },
                  { key: 'surfaceColor',    label: 'משטחים' },
                  { key: 'textColor',       label: 'טקסט ראשי' },
                  { key: 'textSecondary',   label: 'טקסט משני' },
                  { key: 'borderColor',     label: 'גבולות' },
                ] as { key: keyof DesignTokens; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <label className="text-[11px] text-gray-400 flex-1">{label}</label>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg border border-white/10 overflow-hidden">
                        <input type="color" value={theme.tokens[key]}
                          onChange={e => setToken(key, e.target.value)}
                          className="w-8 h-8 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent" />
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono w-14 truncate">{theme.tokens[key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── BRAND ──────────────────────────────────────── */}
          {tab === 'brand' && (
            <div className="space-y-5">
              {uploadError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-[11px] text-red-400">{uploadError}</div>}

              {/* Logo */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">לוגו</p>
                {theme.logoUrl && (
                  <div className="mb-2 p-2 bg-white/[0.03] border border-white/[0.055] rounded-xl flex items-center justify-center" style={{ minHeight: 56 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={theme.logoUrl} alt="לוגו" className="max-h-12 max-w-full object-contain" />
                  </div>
                )}
                <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-[11px] font-medium cursor-pointer transition-all ${logoUploading ? 'border-white/[0.055] text-gray-600' : 'border-dashed border-white/20 text-gray-400 hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-500/5'}`}>
                  {logoUploading ? <><span className="w-3 h-3 border border-gray-600 border-t-gray-400 rounded-full animate-spin" />מעלה...</> : <><IUpload className="w-3 h-3" />{theme.logoUrl ? 'החלף' : 'העלה'} לוגו</>}
                  <input type="file" accept="image/*" className="sr-only" disabled={logoUploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'logoUrl') }} />
                </label>
                <input type="url" value={theme.logoUrl} onChange={e => setTheme(prev => prev ? { ...prev, logoUrl: e.target.value } : prev)}
                  placeholder="או הדבק קישור..." className="mt-1.5 w-full bg-[#070B14] border border-white/[0.055] rounded-lg px-2.5 py-1.5 text-[10px] text-gray-400 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors" />
              </div>

              {/* Favicon */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">פייביקון (32×32)</p>
                {theme.faviconUrl && (
                  <div className="mb-2 flex items-center gap-2 bg-white/[0.03] border border-white/[0.055] rounded-xl px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={theme.faviconUrl} alt="favicon" className="w-8 h-8 object-contain" />
                    <span className="text-[10px] text-gray-500">מוגדר</span>
                  </div>
                )}
                <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-[11px] font-medium cursor-pointer transition-all ${faviconUploading ? 'border-white/[0.055] text-gray-600' : 'border-dashed border-white/20 text-gray-400 hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-500/5'}`}>
                  {faviconUploading ? <><span className="w-3 h-3 border border-gray-600 border-t-gray-400 rounded-full animate-spin" />מעלה...</> : <><IUpload className="w-3 h-3" />{theme.faviconUrl ? 'החלף' : 'העלה'} פייביקון</>}
                  <input type="file" accept="image/png,image/ico,image/svg+xml,image/x-icon" className="sr-only" disabled={faviconUploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'faviconUrl') }} />
                </label>
                <input type="url" value={theme.faviconUrl} onChange={e => setTheme(prev => prev ? { ...prev, faviconUrl: e.target.value } : prev)}
                  placeholder="או הדבק קישור..." className="mt-1.5 w-full bg-[#070B14] border border-white/[0.055] rounded-lg px-2.5 py-1.5 text-[10px] text-gray-400 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors" />
              </div>

              {/* Hero image */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">תמונת ראשית (Hero)</p>
                {theme.heroImageUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-white/[0.055]" style={{ height: 80 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={theme.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-[11px] font-medium cursor-pointer transition-all ${heroUploading ? 'border-white/[0.055] text-gray-600' : 'border-dashed border-white/20 text-gray-400 hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-500/5'}`}>
                  {heroUploading ? <><span className="w-3 h-3 border border-gray-600 border-t-gray-400 rounded-full animate-spin" />מעלה...</> : <><IUpload className="w-3 h-3" />{theme.heroImageUrl ? 'החלף' : 'העלה'} תמונה</>}
                  <input type="file" accept="image/*" className="sr-only" disabled={heroUploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'heroImageUrl') }} />
                </label>
                <input type="url" value={theme.heroImageUrl} onChange={e => setTheme(prev => prev ? { ...prev, heroImageUrl: e.target.value } : prev)}
                  placeholder="או הדבק קישור..." className="mt-1.5 w-full bg-[#070B14] border border-white/[0.055] rounded-lg px-2.5 py-1.5 text-[10px] text-gray-400 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors" />
              </div>
            </div>
          )}

          {/* ── TYPOGRAPHY ─────────────────────────────────── */}
          {tab === 'typography' && (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">פונט</p>
                <div className="space-y-1.5">
                  {FONTS.map(font => (
                    <button key={font} onClick={() => setToken('fontFamily', font)}
                      className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-all border ${theme.tokens.fontFamily === font ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.03] border-white/[0.055] text-gray-400 hover:bg-white/[0.06]'}`}
                      style={{ fontFamily: font }}>
                      {font}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">גודל כותרות</p>
                <OptionPills options={[{label:'קטן',value:'sm'},{label:'רגיל',value:'lg'},{label:'גדול',value:'xl'},{label:'ענק',value:'2xl'}]} value={theme.tokens.headingSize} onChange={v => setToken('headingSize', v)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">משקל פונט</p>
                <OptionPills options={[{label:'רגיל',value:'normal'},{label:'בינוני',value:'medium'},{label:'מודגש',value:'bold'},{label:'כבד',value:'extrabold'}]} value={theme.tokens.fontWeight} onChange={v => setToken('fontWeight', v)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">גובה שורה</p>
                <OptionPills options={[{label:'צפוף',value:'tight'},{label:'רגיל',value:'normal'},{label:'מרווח',value:'relaxed'}]} value={theme.tokens.lineHeight} onChange={v => setToken('lineHeight', v)} />
              </div>
            </div>
          )}

          {/* ── LAYOUT ─────────────────────────────────────── */}
          {tab === 'layout' && (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">רוחב עיגול — כפתורים</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {RADIUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setToken('buttonRadius', opt.value)}
                      className={`py-2 text-[9px] font-medium transition-all border text-center ${theme.tokens.buttonRadius === opt.value ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.03] border-white/[0.055] text-gray-500 hover:bg-white/[0.06]'}`}
                      style={{ borderRadius: opt.value }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">רוחב עיגול — כרטיסים</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {RADIUS_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setToken('cardRadius', opt.value)}
                      className={`py-2 text-[9px] font-medium transition-all border text-center ${theme.tokens.cardRadius === opt.value ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.03] border-white/[0.055] text-gray-500 hover:bg-white/[0.06]'}`}
                      style={{ borderRadius: opt.value }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">רוחב הדף</p>
                <OptionPills options={[{label:'צר',value:'sm'},{label:'רגיל',value:'lg'},{label:'רחב',value:'xl'},{label:'מלא',value:'full'}]} value={theme.tokens.containerWidth} onChange={v => setToken('containerWidth', v)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">עוצמת צל</p>
                <OptionPills options={[{label:'ללא',value:'none'},{label:'עדין',value:'sm'},{label:'בינוני',value:'md'},{label:'חזק',value:'lg'}]} value={theme.tokens.shadowIntensity} onChange={v => setToken('shadowIntensity', v)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">עוצמת אנימציות</p>
                <OptionPills options={[{label:'ללא',value:'none'},{label:'עדין',value:'subtle'},{label:'בינוני',value:'moderate'},{label:'עשיר',value:'rich'}]} value={theme.tokens.animationIntensity} onChange={v => setToken('animationIntensity', v)} />
              </div>
            </div>
          )}

          {/* ── HEADER ─────────────────────────────────────── */}
          {tab === 'header' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-300">פס הודעות</p>
                    <p className="text-[9px] text-gray-600">כותרת עליונה בצבע</p>
                  </div>
                  <Toggle on={theme.headerConfig.announcementEnabled} onToggle={() => setHeader('announcementEnabled', !theme.headerConfig.announcementEnabled)} />
                </div>
                {theme.headerConfig.announcementEnabled && (
                  <>
                    <FieldRow label="טקסט ההודעה">
                      <TextInput value={theme.headerConfig.announcementText} onChange={v => setHeader('announcementText', v)} placeholder="🚚 משלוח חינם על כל הזמנה" />
                    </FieldRow>
                    <FieldRow label="צבע רקע">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
                          <input type="color" value={theme.headerConfig.announcementBg}
                            onChange={e => setHeader('announcementBg', e.target.value)}
                            className="w-9 h-9 -translate-x-1 -translate-y-1 cursor-pointer border-0 bg-transparent" />
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">{theme.headerConfig.announcementBg}</span>
                      </div>
                    </FieldRow>
                  </>
                )}
              </div>

              <div className="h-px bg-white/[0.055]" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-300">כותרת דביקה</p>
                  <Toggle on={theme.headerConfig.stickyHeader} onToggle={() => setHeader('stickyHeader', !theme.headerConfig.stickyHeader)} />
                </div>
              </div>

              <div className="h-px bg-white/[0.055]" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-300">כפתור CTA</p>
                    <p className="text-[9px] text-gray-600">כפתור בכותרת</p>
                  </div>
                  <Toggle on={theme.headerConfig.ctaEnabled} onToggle={() => setHeader('ctaEnabled', !theme.headerConfig.ctaEnabled)} />
                </div>
                {theme.headerConfig.ctaEnabled && (
                  <FieldRow label="טקסט הכפתור">
                    <TextInput value={theme.headerConfig.ctaText} onChange={v => setHeader('ctaText', v)} placeholder="הזמן עכשיו" />
                  </FieldRow>
                )}
              </div>

              <div className="h-px bg-white/[0.055]" />

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">פרטי קשר בכותרת</p>
                <FieldRow label="טלפון">
                  <TextInput value={theme.headerConfig.phone} onChange={v => setHeader('phone', v)} placeholder="050-0000000" type="tel" />
                </FieldRow>
                <FieldRow label="WhatsApp" hint="מספר בלבד, ללא +">
                  <TextInput value={theme.headerConfig.whatsapp} onChange={v => setHeader('whatsapp', v)} placeholder="9720500000000" />
                </FieldRow>
              </div>
            </div>
          )}

          {/* ── FOOTER ─────────────────────────────────────── */}
          {tab === 'footer' && (
            <div className="space-y-4">
              <FieldRow label="תיאור המותג" hint="מופיע מתחת ללוגו בפוטר">
                <textarea value={theme.footerConfig.tagline} onChange={e => setFooter('tagline', e.target.value)} rows={2} placeholder="תיאור קצר של העסק..."
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors resize-none" />
              </FieldRow>

              <div className="h-px bg-white/[0.055]" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">רשתות חברתיות</p>

              {([
                { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                { key: 'tiktokUrl',    label: 'TikTok',    placeholder: 'https://tiktok.com/@...' },
                { key: 'whatsappUrl',  label: 'WhatsApp',  placeholder: 'https://wa.me/972...' },
                { key: 'facebookUrl',  label: 'Facebook',  placeholder: 'https://facebook.com/...' },
              ] as { key: keyof FooterConfig; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                <FieldRow key={key} label={label}>
                  <TextInput value={theme.footerConfig[key] as string} onChange={v => setFooter(key, v)} placeholder={placeholder} />
                </FieldRow>
              ))}

              <div className="h-px bg-white/[0.055]" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">פרטי קשר</p>

              <FieldRow label="אימייל">
                <TextInput value={theme.footerConfig.contactEmail} onChange={v => setFooter('contactEmail', v)} placeholder="support@yourstore.com" type="email" />
              </FieldRow>
              <FieldRow label="טלפון">
                <TextInput value={theme.footerConfig.contactPhone} onChange={v => setFooter('contactPhone', v)} placeholder="050-0000000" />
              </FieldRow>
              <FieldRow label="זכויות יוצרים" hint="שנה מוחלפת אוטומטית אם ריק">
                <TextInput value={theme.footerConfig.copyright} onChange={v => setFooter('copyright', v)} placeholder="© 2025 שם העסק. כל הזכויות שמורות." />
              </FieldRow>

              <div className="h-px bg-white/[0.055]" />

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">הצג אייקוני תשלום</p>
                  <Toggle on={theme.footerConfig.showPaymentIcons} onToggle={() => setFooter('showPaymentIcons', !theme.footerConfig.showPaymentIcons)} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">הצג תגי אמון</p>
                  <Toggle on={theme.footerConfig.showTrustBadges} onToggle={() => setFooter('showTrustBadges', !theme.footerConfig.showTrustBadges)} />
                </div>
              </div>
            </div>
          )}

          {/* ── SECTIONS ───────────────────────────────────── */}
          {tab === 'sections' && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">סדר, ניראות ותוכן</p>
              <div className="space-y-1.5">
                {sortedSections.map((section, idx) => {
                  const meta = SECTION_LABELS[section.type] ?? { label: section.type, emoji: '📌', desc: '' }
                  const hasContent = ['hero', 'benefits', 'guarantee', 'cta'].includes(section.type)
                  const isExpanded = expandedSection === section.id
                  return (
                    <div key={section.id} className="rounded-xl border border-white/[0.055] overflow-hidden">
                      {/* Section row */}
                      <div className={`flex items-center gap-2.5 p-2.5 transition-all ${section.enabled ? 'bg-[#0E1629]' : 'bg-white/[0.02] opacity-50'}`}>
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
                        {hasContent && (
                          <button onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                            className={`p-1 rounded transition-colors flex-shrink-0 ${isExpanded ? 'text-blue-400' : 'text-gray-600 hover:text-gray-300'}`}>
                            {isExpanded ? <IChevronU className="w-3 h-3" /> : <IChevronD className="w-3 h-3" />}
                          </button>
                        )}
                        <Toggle on={section.enabled} onToggle={() => toggleSection(section.id)} />
                      </div>

                      {/* Content editor panel */}
                      {hasContent && isExpanded && (
                        <div className="bg-[#070B14] border-t border-white/[0.055] p-3 space-y-3">
                          {section.type === 'hero' && (
                            <>
                              <FieldRow label="כותרת ראשית">
                                <TextInput value={(section.settings.headline as string) || ''} onChange={v => setSectionSetting(section.id, 'headline', v)} placeholder="מצא את כל מה שאיבדת" />
                              </FieldRow>
                              <FieldRow label="תיאור">
                                <TextArea value={(section.settings.subheadline as string) || ''} onChange={v => setSectionSetting(section.id, 'subheadline', v)} placeholder="תיאור קצר של המוצר..." rows={2} />
                              </FieldRow>
                              <FieldRow label="תג פרומו" hint="הכיתוב בבועה הקטנה מעל הכותרת">
                                <TextInput value={(section.settings.badge as string) || ''} onChange={v => setSectionSetting(section.id, 'badge', v)} placeholder="🎉 מבצע — קנה 2, קבל 1 חינם" />
                              </FieldRow>
                              <FieldRow label="טקסט כפתור">
                                <TextInput value={(section.settings.ctaText as string) || ''} onChange={v => setSectionSetting(section.id, 'ctaText', v)} placeholder="לרכישה עכשיו" />
                              </FieldRow>
                            </>
                          )}

                          {section.type === 'benefits' && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] text-gray-500 font-semibold">פריטים ({getBenefitItems(section).length})</p>
                                <button onClick={() => addBenefitItem(section.id)}
                                  className="text-[9px] text-blue-400 hover:text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-lg transition-colors">
                                  + הוסף
                                </button>
                              </div>
                              {getBenefitItems(section).length === 0 ? (
                                <p className="text-[9px] text-gray-600 text-center py-2">לחץ &quot;+ הוסף&quot; להוסיף פריט יתרון</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {getBenefitItems(section).map((item, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                      <input value={item.emoji} onChange={e => setBenefitItem(section.id, i, 'emoji', e.target.value)}
                                        className="w-9 bg-[#0E1629] border border-white/[0.055] rounded-lg px-1.5 py-1.5 text-[11px] text-center text-white focus:outline-none focus:border-blue-500/40" maxLength={2} />
                                      <div className="flex-1">
                                        <TextInput value={item.text} onChange={v => setBenefitItem(section.id, i, 'text', v)} placeholder="יתרון..." />
                                      </div>
                                      <button onClick={() => removeBenefitItem(section.id, i)} className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {section.type === 'guarantee' && (
                            <>
                              <FieldRow label="כותרת">
                                <TextInput value={(section.settings.headline as string) || ''} onChange={v => setSectionSetting(section.id, 'headline', v)} placeholder="אחריות לכל החיים" />
                              </FieldRow>
                              <FieldRow label="תיאור">
                                <TextArea value={(section.settings.body as string) || ''} onChange={v => setSectionSetting(section.id, 'body', v)} placeholder="תיאור מדיניות האחריות..." rows={3} />
                              </FieldRow>
                            </>
                          )}

                          {section.type === 'cta' && (
                            <>
                              <FieldRow label="כותרת">
                                <TextInput value={(section.settings.headline as string) || ''} onChange={v => setSectionSetting(section.id, 'headline', v)} placeholder="מוכן להפסיק לאבד דברים?" />
                              </FieldRow>
                              <FieldRow label="תיאור">
                                <TextInput value={(section.settings.body as string) || ''} onChange={v => setSectionSetting(section.id, 'body', v)} placeholder="הזמן עכשיו וקבל משלוח חינם" />
                              </FieldRow>
                              <FieldRow label="טקסט כפתור">
                                <TextInput value={(section.settings.ctaText as string) || ''} onChange={v => setSectionSetting(section.id, 'ctaText', v)} placeholder="הזמן עכשיו" />
                              </FieldRow>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── ADVANCED ───────────────────────────────────── */}
          {tab === 'advanced' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ICode className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">CSS מותאם אישית</p>
                </div>
                <p className="text-[9px] text-gray-600 mb-2 leading-relaxed">
                  הוסף CSS שיחול על כל דפי החנות. משתנים זמינים: <span className="font-mono text-gray-500">--primary</span>, <span className="font-mono text-gray-500">--accent</span>, <span className="font-mono text-gray-500">--bg</span>
                </p>
                <textarea
                  value={theme.customCss}
                  onChange={e => setTheme(prev => prev ? { ...prev, customCss: e.target.value } : prev)}
                  rows={8} placeholder={`.hero-section {\n  background: var(--primary);\n}\n\n.cta-button {\n  font-size: 1.125rem;\n}`}
                  className="w-full bg-[#070B14] border border-white/[0.055] rounded-xl px-3 py-2.5 text-[10px] text-gray-400 placeholder:text-gray-700 focus:outline-none focus:border-blue-500/40 transition-colors resize-none font-mono leading-relaxed" />
              </div>

              <div className="h-px bg-white/[0.055]" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IHash className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">מצב פרסום</p>
                </div>
                <div className="bg-[#0E1629] border border-white/[0.055] rounded-xl p-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">גרסה נוכחית</span>
                    <span className="text-white font-mono">v{theme.version ?? 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">סטטוס</span>
                    <span className={theme.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}>
                      {theme.status === 'published' ? 'פורסם' : 'טיוטה'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#0E1629] border-b border-white/[0.055] px-4 py-2.5 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">תצוגה מקדימה</p>
          <div className="flex items-center gap-1">
            {(['desktop','tablet','mobile'] as const).map(device => (
              <button key={device} onClick={() => setPreviewDevice(device)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${previewDevice === device ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {device === 'desktop' ? 'מחשב' : device === 'tablet' ? 'טאבלט' : 'מובייל'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#060A12] flex items-center justify-center p-6">
          <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            previewDevice === 'desktop' ? 'w-full max-w-5xl' : previewDevice === 'tablet' ? 'w-[768px]' : 'w-[390px]'
          }`} style={{ minHeight: '600px' }}>
            {/* Live preview */}
            <div style={{ background: theme.tokens.backgroundColor, color: theme.tokens.textColor, fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif` }}>

              {/* Announcement bar */}
              {theme.headerConfig.announcementEnabled && (
                <div style={{ background: theme.headerConfig.announcementBg, padding: '8px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', direction: 'rtl' }}>
                  {theme.headerConfig.announcementText || '🚚 משלוח חינם על כל הזמנה'}
                </div>
              )}

              {/* Mock header */}
              <div style={{ borderBottom: `1px solid ${theme.tokens.borderColor}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'rtl' }}>
                {theme.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={theme.logoUrl} alt="לוגו" style={{ height: 32, objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontWeight: 800, color: theme.tokens.primaryColor, fontSize: '1.125rem' }}>שם החנות</span>
                )}
                {theme.headerConfig.ctaEnabled && (
                  <button style={{ background: theme.tokens.primaryColor, color: '#fff', border: 'none', borderRadius: theme.tokens.buttonRadius, padding: '6px 16px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif` }}>
                    {theme.headerConfig.ctaText || 'הזמן עכשיו'}
                  </button>
                )}
              </div>

              {/* Hero */}
              <div style={{ background: theme.tokens.primaryColor, padding: '3rem 2rem', textAlign: 'center', direction: 'rtl' }}>
                <h1 style={{ color: '#fff', fontSize: theme.tokens.headingSize === '2xl' ? '2.5rem' : theme.tokens.headingSize === 'xl' ? '2rem' : theme.tokens.headingSize === 'sm' ? '1.25rem' : '1.75rem', fontWeight: theme.tokens.fontWeight === 'extrabold' ? 800 : theme.tokens.fontWeight === 'bold' ? 700 : theme.tokens.fontWeight === 'medium' ? 500 : 400, marginBottom: '0.75rem', fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif`, lineHeight: theme.tokens.lineHeight === 'tight' ? 1.25 : theme.tokens.lineHeight === 'relaxed' ? 1.75 : 1.5 }}>
                  {previewHeadline}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', fontSize: '1rem' }}>{previewSubheadline}</p>
                <button style={{ background: theme.tokens.accentColor, color: '#000', border: 'none', borderRadius: theme.tokens.buttonRadius, padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif` }}>
                  {previewCtaText}
                </button>
              </div>

              {/* Benefits bar */}
              <div style={{ background: '#fff', padding: '1rem 1.5rem', direction: 'rtl', borderBottom: `1px solid ${theme.tokens.borderColor}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: previewDevice === 'mobile' ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '0.5rem' }}>
                  {previewBenefits.slice(0, 4).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: theme.tokens.surfaceColor, borderRadius: theme.tokens.cardRadius, padding: '0.5rem 0.75rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{item.emoji}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 500, color: theme.tokens.textColor, fontFamily: `'${theme.tokens.fontFamily}', 'Rubik', sans-serif` }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer preview */}
              <div style={{ background: '#111827', padding: '1.5rem 2rem', direction: 'rtl' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  {theme.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={theme.logoUrl} alt="" style={{ height: 24, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                  ) : (
                    <span style={{ color: '#fff', fontWeight: 800 }}>שם החנות</span>
                  )}
                </div>
                {theme.footerConfig.tagline && (
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{theme.footerConfig.tagline}</p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem' }}>
                  {theme.footerConfig.instagramUrl && <span style={{ background: '#1f2937', color: '#9ca3af', padding: '4px 10px', borderRadius: '6px', fontSize: '0.6875rem' }}>Instagram</span>}
                  {theme.footerConfig.tiktokUrl && <span style={{ background: '#1f2937', color: '#9ca3af', padding: '4px 10px', borderRadius: '6px', fontSize: '0.6875rem' }}>TikTok</span>}
                  {theme.footerConfig.whatsappUrl && <span style={{ background: '#1f2937', color: '#9ca3af', padding: '4px 10px', borderRadius: '6px', fontSize: '0.6875rem' }}>WhatsApp</span>}
                  {!theme.footerConfig.instagramUrl && !theme.footerConfig.tiktokUrl && !theme.footerConfig.whatsappUrl && (
                    <span style={{ color: '#4b5563', fontSize: '0.6875rem' }}>הוסף רשתות חברתיות ← טאב פוטר</span>
                  )}
                </div>
                {theme.footerConfig.contactEmail && (
                  <p style={{ color: '#6b7280', fontSize: '0.6875rem', marginTop: '0.5rem' }}>📧 {theme.footerConfig.contactEmail}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
