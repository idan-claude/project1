'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const DEFAULTS = {
  storeName: 'FindCard',
  storePhone: '',
  storeEmail: 'findcardsupport@gmail.com',
  storeAddress: '',
  storeCity: '',
}

export default function AdminSettingsPage() {
  const [storeSettings, setStoreSettings] = useState(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings?key=store')
      .then((r) => r.json())
      .then((d) => { if (d.settings?.storeName) setStoreSettings((p) => ({ ...p, ...d.settings })) })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'store', value: storeSettings }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function set(key: string, value: string) {
    setStoreSettings((p) => ({ ...p, [key]: value }))
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl" dir="rtl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">ניהול החנות</h1>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide text-gray-500">פרטי החנות</h2>

        <Input
          label="שם החנות"
          value={storeSettings.storeName}
          onChange={(e) => set('storeName', e.target.value)}
        />
        <Input
          label="אימייל תמיכה"
          type="email"
          value={storeSettings.storeEmail}
          onChange={(e) => set('storeEmail', e.target.value)}
        />
        <Input
          label="טלפון"
          type="tel"
          value={storeSettings.storePhone}
          onChange={(e) => set('storePhone', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="כתובת"
            value={storeSettings.storeAddress}
            onChange={(e) => set('storeAddress', e.target.value)}
          />
          <Input
            label="עיר"
            value={storeSettings.storeCity}
            onChange={(e) => set('storeCity', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" loading={saving}>שמור שינויים</Button>
          {saved && <p className="text-green-600 text-sm font-medium">✓ נשמר בהצלחה</p>}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">משלוח</h2>
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 inline-block">✓ משלוח חינם על כל ההזמנות</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-1">הגדרות תשלום והתראות</h2>
        <p className="text-sm text-gray-500 mt-1">הגדרות Cardcom, Twilio ו-SMTP מוזנות דרך קובץ <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code> בשרת.</p>
      </div>
    </div>
  )
}
