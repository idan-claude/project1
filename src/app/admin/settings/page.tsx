'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminSettingsPage() {
  const [storeSettings, setStoreSettings] = useState({ storeName: 'TrackIt IL', storePhone: '', storeEmail: '', freeShippingThreshold: '300' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings?key=store')
      .then((r) => r.json())
      .then((d) => { if (d.settings?.storeName) setStoreSettings(d.settings) })
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
    setTimeout(() => setSaved(false), 2000)
  }

  function set(key: string, value: string) {
    setStoreSettings((p) => ({ ...p, [key]: value }))
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">הגדרות החנות</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">פרטי החנות</h2>
        <Input label="שם החנות" value={storeSettings.storeName} onChange={(e) => set('storeName', e.target.value)} />
        <Input label="טלפון" value={storeSettings.storePhone} onChange={(e) => set('storePhone', e.target.value)} />
        <Input label="אימייל" type="email" value={storeSettings.storeEmail} onChange={(e) => set('storeEmail', e.target.value)} />
        <Input label="סף משלוח חינם (₪)" type="number" value={storeSettings.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', e.target.value)} />

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>שמור</Button>
          {saved && <p className="text-green-600 text-sm font-medium">✓ נשמר בהצלחה</p>}
        </div>
      </form>

      <div className="bg-gray-50 border border-dashed rounded-xl p-5 mt-6 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-2">הגדרות תשלום והתראות</p>
        <p>הגדרות Cardcom, Twilio ו-SMTP מוזנות דרך קובץ <code>.env.local</code> בשרת.</p>
      </div>
    </div>
  )
}
