'use client'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

interface Invoice {
  _id: string
  orderNumber: string
  customer: string
  email: string
  total: number
  date: string
  status: string
  shippingAddress?: { street?: string; city?: string; zip?: string }
  items?: Array<{ nameHe?: string; quantity?: number; unitPrice?: number }>
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  function load(q = '') {
    setLoading(true)
    fetch(`/api/admin/invoices${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function printInvoice(inv: Invoice) {
    const win = window.open('', '_blank')
    if (!win) return
    const itemsHtml = (inv.items || []).map((item) =>
      `<tr><td>${item.nameHe || '—'}</td><td style="text-align:center">${item.quantity || 1}</td><td style="text-align:left">${formatPrice(item.unitPrice || 0)}</td></tr>`
    ).join('')
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"/>
      <title>חשבונית ${inv.orderNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;font-size:13px}th{background:#f5f5f5}@media print{.no-print{display:none}}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
        <div><h1 style="margin:0">FindCard</h1><p style="margin:4px 0;color:#666;font-size:13px">findcardsupport@gmail.com</p></div>
        <div style="text-align:left"><strong>חשבונית</strong><br/>${inv.orderNumber}<br/><small>${new Date(inv.date).toLocaleDateString('he-IL')}</small></div>
      </div>
      <div style="background:#f9f9f9;padding:12px;border-radius:8px;margin-bottom:20px;font-size:13px">
        <strong>לקוח:</strong> ${inv.customer}<br/><strong>אימייל:</strong> ${inv.email}
        ${inv.shippingAddress?.city ? `<br/><strong>כתובת:</strong> ${inv.shippingAddress.street || ''} ${inv.shippingAddress.city}` : ''}
      </div>
      <table><thead><tr><th>מוצר</th><th>כמות</th><th>מחיר</th></tr></thead><tbody>
      ${itemsHtml || `<tr><td colspan="3">—</td></tr>`}
      </tbody></table>
      <div style="text-align:left;margin-top:16px"><strong style="font-size:16px">סה"כ: ${formatPrice(inv.total)}</strong></div>
      <div style="text-align:center;margin-top:32px"><button onclick="window.print()" class="no-print" style="padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">הדפס</button></div>
      </body></html>`)
    win.document.close()
  }

  const STATUS_COLOR: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-600',
    refunded: 'bg-orange-100 text-orange-700',
  }
  const STATUS_LABEL: Record<string, string> = { paid: 'שולם', pending: 'ממתין', failed: 'נכשל', refunded: 'הוחזר' }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">חשבוניות</h1>
        <div className="sm:mr-auto max-w-sm w-full">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="חיפוש לפי שם, הזמנה, אימייל..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-gray-600 font-semibold">אין חשבוניות עדיין</p>
          <p className="text-xs text-gray-400 mt-1">חשבוניות ייווצרו אוטומטית עם כל הזמנה</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">הזמנה</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden md:table-cell">לקוח</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">סכום</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700 hidden md:table-cell">תאריך</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">סטטוס</th>
                <th className="px-5 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{inv.orderNumber}</td>
                  <td className="px-5 py-3.5 text-gray-800 hidden md:table-cell">{inv.customer}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">{formatPrice(inv.total)}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">{new Date(inv.date).toLocaleDateString('he-IL')}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLOR[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => printInvoice(inv)} className="text-blue-600 hover:underline text-xs font-semibold">הדפס</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
