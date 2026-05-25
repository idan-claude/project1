'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface DashData {
  revenueMonth: number
  orderCountMonth: number
  openOrders: number
  avgOrderValue: number
  lowStockProducts: Array<{ nameHe: string; inventory: { quantity: number } }>
}

export default function AIInsightsPage() {
  const [data, setData] = useState<DashData | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(setData)
  }, [])

  const insights = data ? [
    data.openOrders > 5 && {
      type: 'urgent',
      title: `${data.openOrders} הזמנות ממתינות לטיפול`,
      body: 'יש הזמנות פתוחות זמן רב — שקול לעדכן לקוחות על מצב המשלוח.',
      action: '/admin/orders',
      actionLabel: 'לטיפול בהזמנות',
    },
    data.lowStockProducts.length > 0 && {
      type: 'warning',
      title: `${data.lowStockProducts.length} מוצרים עם מלאי נמוך`,
      body: `כולל: ${data.lowStockProducts.slice(0, 2).map(p => p.nameHe).join(', ')}`,
      action: '/admin/inventory',
      actionLabel: 'ניהול מלאי',
    },
    data.avgOrderValue > 0 && {
      type: 'tip',
      title: `ממוצע הזמנה: ${formatPrice(data.avgOrderValue)}`,
      body: 'הגדלת ממוצע הזמנה ב-20% תגדיל הכנסות משמעותית. שקול bundle offers או upsell.',
      action: '/admin/marketing',
      actionLabel: 'קמפיין שיווקי',
    },
    {
      type: 'info',
      title: 'ניתוח שיא שעות',
      body: 'עבור לאנליטיקה לראות באיזה שעות מגיעות רוב ההזמנות — שם כדאי לשלוח קמפיינים.',
      action: '/admin/analytics',
      actionLabel: 'לאנליטיקה',
    },
  ].filter(Boolean) : []

  const TYPE_STYLE: Record<string, string> = {
    urgent: 'border-red-500/30 bg-red-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    tip: 'border-blue-500/30 bg-blue-500/5',
    info: 'border-white/10 bg-white/[0.02]',
  }
  const TYPE_ICON: Record<string, string> = {
    urgent: '🔴', warning: '🟡', tip: '💡', info: 'ℹ️',
  }

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#080C16]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">תובנות AI</h1>
        <p className="text-sm text-gray-500 mt-0.5">המלצות חכמות מבוססות נתוני החנות</p>
      </div>

      {!data ? (
        <div className="text-gray-600 text-sm animate-pulse">מנתח נתונים...</div>
      ) : (
        <div className="space-y-3">
          {insights.map((ins: any, i) => (
            <div key={i} className={`border rounded-xl p-5 ${TYPE_STYLE[ins.type]}`}>
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{TYPE_ICON[ins.type]}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{ins.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{ins.body}</p>
                  <a href={ins.action} className="inline-block mt-2 text-xs text-blue-400 hover:underline">{ins.actionLabel} →</a>
                </div>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <p className="text-3xl mb-2">✦</p>
              <p className="text-sm">אין תובנות לעת עתה — הנתונים ייאספו עם הזמן</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
