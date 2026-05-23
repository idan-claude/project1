'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState({ nameHe: '', description: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(data.categories || [])
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ nameHe: '', description: '' })
    await load()
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק קטגוריה "${name}"?`)) return
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">קטגוריות</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">הוסף קטגוריה</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="שם קטגוריה (עברית) *" value={form.nameHe} onChange={(e) => setForm((p) => ({ ...p, nameHe: e.target.value }))} required />
            <Input label="תיאור (אופציונלי)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            <Button type="submit" loading={saving}>הוסף קטגוריה</Button>
          </form>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">שם</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">slug</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-gray-400">אין קטגוריות עדיין</td></tr>}
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.nameHe}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.slug}</td>
                  <td className="px-4 py-3">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(c._id, c.nameHe)}>מחק</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
