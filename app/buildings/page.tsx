'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Building, Project } from '@/types/database'
import Button from '@/components/shared/Button'
import { Plus, TrendingUp, Wrench } from 'lucide-react'
import Link from 'next/link'

interface BuildingWithProject extends Building {
  project: Project | null
  services_count: number
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingWithProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
    fetchBuildings()
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchBuildings = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('buildings')
        .select(`
          *,
          projects (*)
        `)
        .order('created_at', { ascending: false })

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      const { data, error } = await query

      if (error) throw error

      // Get services count for each building
      const buildingsWithCounts = await Promise.all(
        (data || []).map(async (building: any) => {
          const { count } = await supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('building_id', building.id)

          return {
            ...building,
            project: building.projects,
            services_count: count || 0,
          }
        })
      )

      setBuildings(buildingsWithCounts)
    } catch (error) {
      console.error('Error fetching buildings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (progress: number) => {
    if (progress === 0) return { label: 'تخطيط', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' }
    if (progress < 50) return { label: 'قيد التنفيذ', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' }
    if (progress < 100) return { label: 'قيد التنفيذ', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300' }
    return { label: 'مكتمل', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">جاري التحميل...</div>
  }

  return (
    <div>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">إدارة البنايات</h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">إدارة البنايات وتقسيمات المشاريع</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 mb-4 lg:mb-6">
        <Button className="w-full sm:w-auto justify-center sm:justify-start">
          <Plus size={14} className="ml-1 sm:ml-1.5" />
          <span className="text-xs">إضافة بناية</span>
        </Button>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          <option value="all">جميع المشاريع</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {buildings.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
            لا توجد بنايات
          </div>
        ) : (
          buildings.map((building) => {
            const status = getStatusLabel(building.total_progress)
            return (
              <div
                key={building.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{building.building_code}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {building.building_code === 'الرئيسية' ? 'البناية الرئيسية' : `البناية ${building.building_code}`}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-4">{building.project?.name || 'بدون مشروع'}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-400">الخدمات:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{building.services_count} خدمة</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 dark:text-gray-400">نسبة الإنجاز:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{building.total_progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${building.total_progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/buildings/${building.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      <TrendingUp size={14} className="ml-1.5" />
                      <span>من الإنجاز</span>
                    </Button>
                  </Link>
                  <Link href={`/buildings/${building.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      <Wrench size={14} className="ml-1.5" />
                      <span>الخدمات</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

