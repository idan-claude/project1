'use client'
import { useState } from 'react'
import { formatPrice } from '@/lib/utils/formatPrice'

const MOCK_INVOICES = [
  { id: 'INV-2026-001', orderNumber: 'ORD-2026-0042', customer: 'מיכל כהן', email: 'michal@gmail.com', total: 19990, date: '2026-05-24', status: 'paid' },
  { id: 'INV-2026-002', orderNumber: 'ORD-2026-0041', customer: 'דני לוי', email: 'danny@walla.co.il', total: 29990, date: '2026-05-23', status: 'paid' },
  { id: 'INV-2026-003', orderNumber: 'ORD-2026-0040', customer: 'שירה מזרחי', email: 'shira@gmail.com', total: 37990, date: '2026-05-22', status: 'paid' },
  { id: 'INV-2026-004', orderNumber: 'ORD-2026-0039', customer: 'יוסי אברהם', email: 'yossi@hotmail.com', total: 19990, date: '2026-05-21', status: 'pending' },
  { id: 'INV-2026-005', orderNumber: 'ORD-2026-0038', customer: 'נועה ברק', email: 'noa@gmail.com', total: 29990, date: '2026-05-20', status: 'paid' },
]

export default function InvoicesPage() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_INVOICES.filter(
    (inv) =>
      inv.customer.includes(search) ||
      inv.id.includes(search) ||
      inv.orderNumber.includes(search)
  )

  const printInvoice = (inv: typeof MOCK_INVOICES[0]) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="utf-8"/>
        <title>חשבונית ${inv.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { border-bottom: 2px solid #2563EB; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { color: #2563EB; font-size: 24px; font-weight: 900; }
          .inv-number { color: #6B7280; font-size: 14px; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .total { font-size: 18px; font-weight: 700; border-top: 1px solid #E5E7EB; padding-top: 12px; margin-top: 12px; }
          .badge { background: #D1FAE5; color: #065F46; padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">FindCard</div>
          <div class="inv-number">חשבונית: ${inv.id}</div>
        </div>
        <div class="row"><span>לקוח:</span><span>${inv.customer}</span></div>
        <div class="row"><span>אימייל:</span><span>${inv.email}</span></div>
        <div class="row"><span>הזמנה:</span><span>${inv.orderNumber}</span></div>
        <div class="row"><span>תאריך:</span><span>${inv.date}</span></div>
        <div class="row"><span>סטטוס:</span><span class="badge">שולם</span></div>
        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #E5E7EB;"/>
        <div class="row"><span>FindCard PRO</span><span>${formatPrice(inv.total)}</span></div>
        <div class="row"><span>משלוח</span><span>חינם</span></div>
        <div class="row total"><span>סה"כ לתשלום</span><span>${formatPrice(inv.total)}</span></div>
        <p style="margin-top: 40px; font-size: 12px; color: #9CA3AF; text-align: center;">FindCard · תל אביב, ישראל · support@findcard.co.il</p>
      </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">חשבוניות</h1>
          <p className="text-sm text-gray-500">{MOCK_INVOICES.length} חשבוניות</p>
        </div>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי לקוח, מספר חשבונית..."
            className="bg-white border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">מספר חשבונית</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">לקוח</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">הזמנה</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">תאריך</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">סכום</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">סטטוס</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-sm font-mono font-semibold text-blue-700">{inv.id}</td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-gray-900">{inv.customer}</p>
                  <p className="text-xs text-gray-400">{inv.email}</p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{inv.orderNumber}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{inv.date}</td>
                <td className="px-5 py-4 text-sm font-bold text-gray-900">{formatPrice(inv.total)}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status === 'paid' ? 'שולם' : 'ממתין'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => printInvoice(inv)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    🖨️ הדפס
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-gray-400 text-sm">לא נמצאו חשבוניות</p>
          </div>
        )}
      </div>
    </div>
  )
}
