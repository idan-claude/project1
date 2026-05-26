'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface VisitorProfile {
  visitorId: string
  firstSeen: string
  lastSeen: string
  sessionCount: number
  totalDuration: number
  isReturning: boolean
  engagementScore: number
  purchaseIntentScore: number
  bounceProbability: number
  hesitationScore: number
  frustrationScore: number
  attentionScore: number
  ctaHesitationSec: number | null
  rageClicks: number
  maxScrollPct: number
  productViews: number
  cartAdds: number
  checkoutStarts: number
  checkoutCompletes: number
  faqOpens: number
  ctaClicks: number
  exitPages: number
  device: string
  browser: string
  os: string
  country: string
  city: string
  region: string
  confidence: number
  isp: string
  ipMasked: string
  language: string
  timezone: string
  utmSource: string
  utmCampaign: string
  sessionTimeline: Array<{
    sessionId: string
    firstSeen: string
    lastSeen: string
    duration: number
    eventCount: number
    device: string
    converted: boolean
    addedToCart: boolean
    startedCheckout: boolean
    events: Array<{
      event: string
      path: string
      scroll: number
      createdAt: string
      meta: Record<string, unknown>
    }>
  }>
  fraudSignals: { rageClicks: boolean; tooFast: boolean; multipleCheckouts: boolean }
}

const EVENT_ICONS: Record<string, string> = {
  pageview: '👁', product_view: '🛍', add_to_cart: '🛒', checkout_start: '💳',
  checkout_complete: '📋', scroll_depth: '📜', rage_click: '😤', exit_page: '🚪',
  faq_open: '❓', gallery_view: '🖼', cta_click: '🎯', inactive: '💤', custom: '📍',
}
const EVENT_LABELS: Record<string, string> = {
  pageview: 'דף נצפה', product_view: 'צפה במוצר', add_to_cart: 'הוסיף לסל',
  checkout_start: 'התחיל תשלום', checkout_complete: 'הגיע לדף אישור',
  scroll_depth: 'גלילה', rage_click: 'לחיצות כעס', exit_page: 'יציאה',
  faq_open: 'פתח שאלה', gallery_view: 'גלריה', cta_click: 'לחץ CTA', inactive: 'לא פעיל',
}

function fmtDuration(s: number): string {
  if (s < 60) return `${s}ש׳`
  const m = Math.floor(s / 60)
  return `${m}ד׳ ${s % 60}ש׳`
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-white/5 rounded-full h-2">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-left">{value}</span>
    </div>
  )
}

export default function VisitorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<VisitorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [openSession, setOpenSession] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/visitors/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        if (d.error) throw new Error(d.error)
        setProfile(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="p-6 min-h-screen bg-[#080C16] space-y-3">
      {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-[#0E1525] rounded-2xl animate-pulse" />)}
    </div>
  )

  if (error || !profile) return (
    <div className="p-6 min-h-screen bg-[#080C16] flex flex-col items-center justify-center gap-4">
      <p className="text-red-400 text-sm">{error || 'מבקר לא נמצא'}</p>
      <Link href="/admin/analytics/visitors" className="text-xs text-blue-400 hover:underline">
        חזרה לניתוח מבקרים
      </Link>
    </div>
  )

  const fraudCount = Object.values(profile.fraudSignals).filter(Boolean).length
  const intentColor = profile.purchaseIntentScore >= 70 ? 'bg-emerald-500' : profile.purchaseIntentScore >= 40 ? 'bg-amber-500' : 'bg-gray-600'
  const engageColor = profile.engagementScore >= 70 ? 'bg-blue-500' : profile.engagementScore >= 30 ? 'bg-indigo-500' : 'bg-gray-600'

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/analytics/visitors" className="text-gray-500 hover:text-gray-300 text-xs">
              ← מבקרים
            </Link>
          </div>
          <h1 className="text-lg font-bold text-white font-mono">{profile.visitorId.slice(0, 16)}...</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {profile.isReturning && (
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">חוזר</span>
            )}
            {fraudCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                {fraudCount} אות חשד
              </span>
            )}
            <span className="text-xs text-gray-500">
              ראשון: {new Date(profile.firstSeen).toLocaleDateString('he-IL')} ·
              אחרון: {new Date(profile.lastSeen).toLocaleDateString('he-IL')}
            </span>
          </div>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">כוונת רכישה</p>
          <p className={`text-2xl font-black ${profile.purchaseIntentScore >= 70 ? 'text-emerald-400' : profile.purchaseIntentScore >= 40 ? 'text-amber-400' : 'text-gray-400'}`}>
            {profile.purchaseIntentScore}
          </p>
          <ScoreBar value={profile.purchaseIntentScore} color={intentColor} />
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">מעורבות</p>
          <p className={`text-2xl font-black ${profile.engagementScore >= 50 ? 'text-blue-400' : 'text-gray-400'}`}>
            {profile.engagementScore}
          </p>
          <ScoreBar value={profile.engagementScore} color={engageColor} />
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">סשנים</p>
          <p className="text-2xl font-black text-white">{profile.sessionCount}</p>
          <p className="text-xs text-gray-600 mt-1">סה״כ: {fmtDuration(profile.totalDuration)}</p>
        </div>
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">נטישה</p>
          <p className={`text-2xl font-black ${profile.bounceProbability > 60 ? 'text-red-400' : 'text-gray-400'}`}>
            {profile.bounceProbability}%
          </p>
          <p className="text-xs text-gray-600 mt-1">הסתברות</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Behavior metrics */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">התנהגות</h2>
          <div className="space-y-3">
            {[
              { label: 'צפיות במוצר', value: profile.productViews, icon: '🛍', highlight: false },
              { label: 'הוספות לסל', value: profile.cartAdds, icon: '🛒', highlight: profile.cartAdds > 0 },
              { label: 'התחלות תשלום', value: profile.checkoutStarts, icon: '💳', highlight: profile.checkoutStarts > 0 },
              { label: 'הגיע לדף אישור', value: profile.checkoutCompletes, icon: '📋', highlight: false },
              { label: 'שאלות FAQ', value: profile.faqOpens, icon: '❓', highlight: false },
              { label: 'לחיצות CTA', value: profile.ctaClicks, icon: '🎯', highlight: profile.ctaClicks > 0 },
              { label: 'גלילה מרבית', value: `${profile.maxScrollPct}%`, icon: '📜', highlight: profile.maxScrollPct >= 75 },
              { label: 'לחיצות כעס', value: profile.rageClicks, icon: '😤', highlight: profile.rageClicks > 2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
                <span className={`text-sm font-semibold ${item.highlight ? 'text-emerald-400' : 'text-gray-300'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Identity */}
        <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">זיהוי</h2>
          <div className="space-y-3">
            {[
              { label: 'מדינה', value: profile.country || '—' },
              { label: 'עיר', value: profile.city || '—' },
              { label: 'אזור', value: profile.region || '—' },
              { label: 'מכשיר', value: profile.device },
              { label: 'דפדפן', value: profile.browser || '—' },
              { label: 'מערכת הפעלה', value: profile.os || '—' },
              { label: 'שפה', value: profile.language || '—' },
              { label: 'אזור זמן', value: profile.timezone || '—' },
              { label: 'ISP', value: profile.isp || '—' },
              { label: 'IP (מוסתר)', value: profile.ipMasked || '—' },
            ].filter(i => i.value !== '—' || true).map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs text-gray-300 font-mono">{item.value}</span>
              </div>
            ))}
            {profile.confidence > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">דיוק מיקום</span>
                <span className={`text-xs font-semibold ${profile.confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {profile.confidence}%
                </span>
              </div>
            )}
          </div>
          {(profile.utmSource) && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-2">מקור תנועה</p>
              <div className="flex gap-2 flex-wrap">
                {profile.utmSource && <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">{profile.utmSource}</span>}
                {profile.utmCampaign && <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">{profile.utmCampaign}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fraud signals */}
      {fraudCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-red-400 mb-3">אותות חשד</h2>
          <div className="space-y-2">
            {profile.fraudSignals.rageClicks && (
              <div className="flex items-center gap-2 text-xs text-red-300">
                <span>😤</span> <span>יותר מ-3 לחיצות כעס — עלול להיות תסכול מממשק</span>
              </div>
            )}
            {profile.fraudSignals.tooFast && (
              <div className="flex items-center gap-2 text-xs text-red-300">
                <span>⚡</span> <span>השלים תשלום בפחות מ-5 שניות — חשד לבוט</span>
              </div>
            )}
            {profile.fraudSignals.multipleCheckouts && (
              <div className="flex items-center gap-2 text-xs text-red-300">
                <span>🔄</span> <span>יותר מ-2 checkout_complete events — חריג</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session timeline */}
      <div className="bg-[#0E1525] border border-white/5 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">מסעות ({profile.sessionTimeline.length})</h2>
        <p className="text-xs text-gray-600 mb-4">לחץ על סשן לפרטי אירועים</p>
        <div className="space-y-2">
          {profile.sessionTimeline.map((sess) => {
            const isOpen = openSession === sess.sessionId
            return (
              <div key={sess.sessionId} className="border border-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenSession(isOpen ? null : sess.sessionId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-right"
                >
                  <span className="text-lg flex-shrink-0">
                    {sess.converted ? '📋' : sess.startedCheckout ? '💳' : sess.addedToCart ? '🛒' : '👁'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300">{new Date(sess.firstSeen).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {sess.events.slice(0, 10).map((e, i) => (
                        <span key={i} className="text-xs" title={EVENT_LABELS[e.event] || e.event}>
                          {EVENT_ICONS[e.event] || '•'}
                        </span>
                      ))}
                      {sess.events.length > 10 && <span className="text-[10px] text-gray-600">+{sess.events.length - 10}</span>}
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-[10px] text-gray-600">{sess.eventCount} אירועים</p>
                    <p className="text-[10px] text-gray-600">{sess.duration > 0 ? fmtDuration(sess.duration) : '—'}</p>
                  </div>
                  <span className={`text-gray-500 text-xs flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                    {sess.events.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <span className="text-base flex-shrink-0 mt-0.5">{EVENT_ICONS[e.event] || '•'}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-300 font-medium">{EVENT_LABELS[e.event] || e.event}</span>
                          {e.path && <span className="text-gray-600 mr-2">{e.path}</span>}
                          {e.scroll > 0 && <span className="text-gray-600"> · {e.scroll}%</span>}
                          {e.meta && Object.keys(e.meta).length > 0 && (
                            <span className="text-gray-700 mr-2 text-[10px]">
                              {Object.entries(e.meta).filter(([k]) => k !== 'path').slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-700 flex-shrink-0">
                          {new Date(e.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
