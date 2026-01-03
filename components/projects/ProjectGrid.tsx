'use client'

import { useState, useEffect } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { createClient } from '@/lib/supabaseClient'
import { FolderKanban, Building2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import Button from '@/components/shared/Button'

interface ProjectWithStats {
  id: string
  name: string
  status: string
  area: { name: string } | null
  company: { name: string } | null
  created_at: string
  buildingsCount: number
  totalValue: number
}

export default function ProjectGrid() {
  const { projects, loading, error } = useProjects()
  const [projectsWithStats, setProjectsWithStats] = useState<ProjectWithStats[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (projects.length > 0) {
      fetchProjectsStats()
    } else {
      setProjectsWithStats([])
      setLoadingStats(false)
    }
  }, [projects])

  const fetchProjectsStats = async () => {
    try {
      setLoadingStats(true)
      
      const projectsWithStatsData = await Promise.all(
        projects.map(async (project) => {
          // Get buildings count
          const { count: buildingsCount } = await supabase
            .from('buildings')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)

          // Get total value from services
          const { data: buildings } = await supabase
            .from('buildings')
            .select('id')
            .eq('project_id', project.id)

          const buildingIds = (buildings as { id: string }[])?.map(b => b.id) || []
          
          let totalValue = 0
          if (buildingIds.length > 0) {
            const { data: services } = await supabase
              .from('services')
              .select('unit_price, quantity')
              .in('building_id', buildingIds)

            totalValue = ((services as { unit_price: number; quantity: number }[]) || []).reduce((sum, s) => sum + (s.unit_price * s.quantity), 0)
          }

          return {
            ...project,
            buildingsCount: buildingsCount || 0,
            totalValue,
          }
        })
      )

      setProjectsWithStats(projectsWithStatsData)
    } catch (err) {
      console.error('Error fetching project stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">جاري التحميل...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 dark:text-red-400">خطأ: {error.message}</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {projectsWithStats.length === 0 ? (
        <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
          لا توجد مشاريع.
        </div>
      ) : (
        projectsWithStats.map((project) => (
          <div
            key={project.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <FolderKanban className="text-blue-600 dark:text-blue-400" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full inline-block mt-1 ${
                      project.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                        : project.status === 'completed'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {project.status === 'active' ? 'نشط' : project.status === 'completed' ? 'مكتمل' : 'متوقف'}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Info */}
            <div className="space-y-2 mb-4 text-sm text-gray-700 dark:text-gray-400">
              <p>
                <span className="font-medium">المنطقة:</span> {project.area?.name || 'غير محدد'}
              </p>
              <p>
                <span className="font-medium">الشركة:</span> {project.company?.name || 'غير محدد'}
              </p>
              <p>
                <span className="font-medium">التاريخ:</span> {formatDate(project.created_at, 'ar-SA')}
              </p>
            </div>

            {/* Stats */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">القيمة الإجمالية</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(project.totalValue, 'ILS')}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    {project.buildingsCount} {project.buildingsCount === 1 ? 'بناية' : 'بناية'}
                  </span>
                </div>
                <Link href={`/projects/${project.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    عرض البنايات
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

