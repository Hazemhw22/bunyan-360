'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useAreas } from '@/hooks/useAreas'
import { useCompanies } from '@/hooks/useCompanies'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'

interface ProjectFormProps {
  projectId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ProjectForm({ projectId, onSuccess, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('')
  const [areaId, setAreaId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [status, setStatus] = useState('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { areas } = useAreas()
  const { companies } = useCompanies()

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId!)
        .single()

      if (error) throw error
      if (data) {
        const projectData = data as any
        setName(projectData.name)
        setAreaId(projectData.area_id || '')
        setCompanyId(projectData.company_id)
        setStatus(projectData.status)
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
      if (projectId) {
        const { error } = await (supabase
          .from('projects')
          .update({
            name,
            area_id: areaId || null,
            company_id: companyId,
            status,
          } as never)
          .eq('id', projectId) as any)

        if (error) throw error
      } else {
        const { error } = await (supabase
          .from('projects')
          .insert([
            {
              name,
              area_id: areaId || null,
              company_id: companyId,
              status,
            },
          ] as never) as any)

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
        label="اسم المشروع"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="مثال: مشروع أبراج النخيل"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المنطقة</label>
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">اختر منطقة</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الشركة (العميل)</label>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">اختر شركة</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الحالة</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="active">نشط</option>
          <option value="completed">مكتمل</option>
          <option value="on_hold">متوقف</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : projectId ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}

