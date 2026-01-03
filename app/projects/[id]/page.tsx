'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Building } from '@/types/database'
import BuildingCard from '@/components/buildings/BuildingCard'
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator'
import Button from '@/components/shared/Button'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [buildings, setBuildings] = useState<Building[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Fetch buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('project_id', projectId)
        .order('building_code', { ascending: true })

      if (buildingsError) throw buildingsError
      setBuildings(buildingsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBuilding = async (buildingCode: string) => {
    try {
      const { error } = await (supabase.from('buildings').insert([
        {
          project_id: projectId,
          building_code: buildingCode,
          total_progress: 0,
        },
      ] as never) as any)

      if (error) throw error
      setShowAddBuilding(false)
      fetchData()
    } catch (error) {
      console.error('Error adding building:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">جاري التحميل...</div>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/projects">
          <Button variant="outline">
            <ArrowLeft size={20} className="ml-2" />
            رجوع
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project?.name || 'المشروع'}</h1>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">البنايات</h2>
          {!showAddBuilding && (
            <Button onClick={() => setShowAddBuilding(true)}>
              <Plus size={20} className="ml-2" />
              إضافة بناية
            </Button>
          )}
        </div>

        {showAddBuilding && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <BuildingForm
              onAdd={(code) => handleAddBuilding(code)}
              onCancel={() => setShowAddBuilding(false)}
            />
          </div>
        )}

        {buildings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            لا توجد بنايات. انقر "إضافة بناية" لإنشاء واحدة.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                id={building.id}
                buildingCode={building.building_code}
                totalProgress={building.total_progress}
                projectId={projectId}
              />
            ))}
          </div>
        )}
      </div>

      {project && buildings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">مولد الفواتير</h2>
          <InvoiceGenerator
            projectId={projectId}
            companyId={project.company_id}
            onInvoiceGenerated={fetchData}
          />
        </div>
      )}
    </div>
  )
}

function BuildingForm({
  onAdd,
  onCancel,
}: {
  onAdd: (code: string) => void
  onCancel: () => void
}) {
  const [code, setCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim()) {
      onAdd(code.trim().toUpperCase())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رمز البناية</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          placeholder="مثال: A, B, C"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">إضافة بناية</Button>
      </div>
    </form>
  )
}

