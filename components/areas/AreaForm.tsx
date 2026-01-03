'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import { Area } from '@/types/database'

interface AreaFormProps {
  areaId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function AreaForm({ areaId, onSuccess, onCancel }: AreaFormProps) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (areaId) {
      fetchArea()
    }
  }, [areaId])

  const fetchArea = async () => {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('id', areaId!)
        .single()

      if (error) throw error
      if (data) {
        const areaData = data as Area
        setName(areaData.name)
        setCity(areaData.city || '')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (areaId) {
        const { error } = await (supabase
          .from('areas')
          .update({ name, city: city || null } as never)
          .eq('id', areaId) as any)

        if (error) throw error
      } else {
        const { error } = await (supabase
          .from('areas')
          .insert([{ name, city: city || null } as never]) as any)

        if (error) throw error
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Input
        label="اسم المنطقة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="مثال: منطقة الرياض"
      />

      <Input
        label="المدينة"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="مثال: الرياض"
      />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : areaId ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}

