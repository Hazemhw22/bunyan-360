'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAreas } from '@/hooks/useAreas'
import { createClient } from '@/lib/supabaseClient'
import Button from '@/components/shared/Button'
import { Plus, MapPin, FileText, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { createNotification } from '@/lib/notifications'

interface AreaListProps {
  onAddClick: () => void
  onEditClick: (id: string) => void
}

interface AreaWithStats {
  id: string
  name: string
  city: string | null
  projectsCount: number
  activeProjectsCount: number
}

export default function AreaList({ onAddClick, onEditClick }: AreaListProps) {
  const { t } = useTranslation()
  const { areas, loading, error, refetch } = useAreas()
  const [areasWithStats, setAreasWithStats] = useState<AreaWithStats[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const supabase = createClient()

  useEffect(() => {
    if (areas.length > 0) {
      fetchAreasStats()
    } else {
      setAreasWithStats([])
      setLoadingStats(false)
    }
  }, [areas])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(menuRefs.current).forEach((areaId) => {
        const menuRef = menuRefs.current[areaId]
        if (menuRef && !menuRef.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      })
    }

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const fetchAreasStats = async () => {
    try {
      setLoadingStats(true)
      const areaIds = areas.map((area) => area.id)

      // Fetch all projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, area_id, status')

      if (projectsError) throw projectsError

      // Calculate stats for each area
      const projectsTyped = (projects || []) as Array<{ area_id: string | null; status: string }>
      const areasWithStatsData: AreaWithStats[] = areas.map((area) => {
        const areaProjects = projectsTyped.filter((p) => p.area_id === area.id)
        const activeProjects = areaProjects.filter((p) => p.status === 'active')

        return {
          id: area.id,
          name: area.name,
          city: area.city,
          projectsCount: areaProjects.length,
          activeProjectsCount: activeProjects.length,
        }
      })

      setAreasWithStats(areasWithStatsData)
    } catch (err) {
      console.error('Error fetching area stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleDelete = async (areaId: string, areaName: string) => {
    if (!confirm(t('common.confirmDelete', 'هل أنت متأكد من حذف هذا العنصر؟'))) {
      return
    }

    try {
      setDeletingId(areaId)
      
      // Check if area has projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('area_id', areaId)
        .limit(1)

      if (projects && projects.length > 0) {
        alert(t('areas.cannotDeleteWithProjects', 'لا يمكن حذف المنطقة لأنها تحتوي على مشاريع'))
        setDeletingId(null)
        setOpenMenuId(null)
        return
      }

      const { error } = await (supabase
        .from('areas')
        .delete()
        .eq('id', areaId) as any)

      if (error) throw error

      await createNotification({
        title: 'تم حذف المنطقة',
        message: `تم حذف المنطقة "${areaName}" بنجاح`,
        type: 'success',
        link: '/areas',
      })

      setOpenMenuId(null)
      refetch()
    } catch (err: any) {
      console.error('Error deleting area:', err)
      alert(err.message || t('common.saveError', 'حدث خطأ أثناء الحذف'))
    } finally {
      setDeletingId(null)
    }
  }

  const toggleMenu = (areaId: string) => {
    setOpenMenuId(openMenuId === areaId ? null : areaId)
  }

  if (loading || loadingStats) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 dark:text-red-400">{t('common.error', 'Error')}: {error.message}</div>
  }

  return (
    <div>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('areas.title')}</h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">{t('areas.subtitle')}</p>
      </div>

      <div className="mb-4 lg:mb-6">
        <Button onClick={onAddClick} className="w-full sm:w-auto justify-center sm:justify-start">
          <Plus size={14} className="ml-1 sm:ml-1.5" />
          <span className="text-xs">{t('areas.addArea')}</span>
        </Button>
      </div>

      {areasWithStats.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          {t('common.noAreas')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {areasWithStats.map((area) => (
            <div
              key={area.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow relative"
            >
              {/* Three dots menu - top left */}
              <div className="absolute top-3 left-3 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600">
                <MoreVertical className="text-gray-500 dark:text-gray-400" size={16} />
              </div>

              {/* Map Icon - top right */}
              <div className="absolute top-4 right-4 w-10 h-10 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center">
                <MapPin className="text-white" size={20} />
              </div>

              {/* Area Info */}
              <div className="mb-4 mt-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{area.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{area.city || t('areas.noCity')}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                  <FileText size={16} />
                  <span className="text-sm font-medium">
                    {area.projectsCount} {area.projectsCount === 1 ? t('areas.project') : t('areas.projects')}
                  </span>
                </div>
                <span className="bg-green-500 dark:bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {area.activeProjectsCount} {t('areas.active')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

