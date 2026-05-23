'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ProfilePage() {
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/profile').then((r) => r.json()).then((d) => {
      if (d.user) setForm({ name: d.user.name || '', phone: d.user.phone || '' })
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/account/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-gray-400 animate-pulse">טוען...</div>

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">הפרופיל שלי</h1>
      <form onSubmit={handleSave} className="bg-white border rounded-xl p-6 space-y-4 max-w-md">
        <Input label="שם מלא" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <Input label="טלפון" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>שמור</Button>
          {saved && <p className="text-green-600 text-sm">✓ נשמר</p>}
        </div>
      </form>
    </div>
  )
}
