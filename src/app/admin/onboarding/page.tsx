'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Step {
  id: string
  title: string
  desc: string
  icon: React.ReactNode
  optional?: boolean
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const steps: Step[] = [
  {
    id: 'store',
    title: 'החנות שלך מוכנה',
    desc: 'חנות ריקה מוכנה לשימוש. עכשיו נגדיר אותה.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    id: 'product',
    title: 'הוסף מוצר ראשון',
    desc: 'כל חנות מתחילה עם מוצר אחד. הוסף עכשיו.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
  {
    id: 'payment',
    title: 'חבר אמצעי תשלום',
    desc: 'כדי לקבל כסף מלקוחות, חבר ספק תשלום.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'pixel',
    title: 'הגדר מעקב מכירות',
    desc: 'חבר Meta Pixel כדי לדעת מאיזה פרסום מגיעות המכירות.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
    optional: true,
  },
]

const STEP_LINKS: Record<string, string> = {
  product: '/admin/products/new',
  payment: '/admin/payments',
  pixel: '/admin/integrations/marketing',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [completed, setCompleted] = useState<Set<string>>(new Set(['store']))

  function complete(id: string, next?: string) {
    setCompleted(s => new Set([...s, id]))
    if (next) router.push(next)
  }

  const allRequired = steps.filter(s => !s.optional).every(s => completed.has(s.id))

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <CheckIcon />
          </div>
          <h1 className="text-2xl font-bold text-[var(--ds-text-1)]">החנות שלך מוכנה!</h1>
          <p className="text-[var(--ds-text-3)] text-sm mt-1">השלם את הצעדים הבאים כדי להתחיל למכור</p>
        </div>

        <div className="space-y-3 mb-6">
          {steps.map((step, i) => {
            const done = completed.has(step.id)
            const canDo = i === 0 || completed.has(steps[i - 1].id) || step.optional
            const link = STEP_LINKS[step.id]

            return (
              <div key={step.id} className={`bg-[#0E1629] border rounded-2xl p-4 transition-all ${
                done ? 'border-emerald-500/20' : canDo ? 'border-white/[0.055]' : 'border-white/[0.03] opacity-60'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    done
                      ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.04] border border-white/[0.055] text-[var(--ds-text-3)]'
                  }`}>
                    {done ? <CheckIcon /> : step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] font-semibold ${done ? 'text-[var(--ds-text-2)] line-through' : 'text-[var(--ds-text-1)]'}`}>
                        {step.title}
                      </p>
                      {step.optional && (
                        <span className="text-[10px] text-[var(--ds-text-3)] bg-white/[0.05] border border-white/[0.055] px-1.5 py-0.5 rounded-full">
                          אופציונלי
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ds-text-3)] mt-0.5">{step.desc}</p>
                  </div>
                  {!done && canDo && link && (
                    <button
                      onClick={() => complete(step.id, link)}
                      className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      התחל
                    </button>
                  )}
                  {!done && canDo && !link && step.id === 'store' && (
                    <button
                      onClick={() => complete(step.id)}
                      className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      סמן כהושלם
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => router.push('/admin')}
          className={`w-full font-semibold text-sm py-3 rounded-xl transition-colors ${
            allRequired
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-white/[0.04] border border-white/[0.055] text-[var(--ds-text-3)] hover:bg-white/[0.07]'
          }`}
        >
          {allRequired ? 'כניסה ללוח הבקרה →' : 'דלג לעת עתה →'}
        </button>
      </div>
    </div>
  )
}
