'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabaseClient'
import { Service, Building, Project } from '@/types/database'
import Button from '@/components/shared/Button'
import { Save } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateEarnedValue } from '@/lib/calculations'

interface ServiceWithRelations extends Service {
  building: Building & { project: Project | null } | null
}

export default function CompletionTrackingPage() {
  const { t } = useTranslation()
  const [services, setServices] = useState<ServiceWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [progressUpdates, setProgressUpdates] = useState<{ [key: string]: number }>({})
  const supabase = createClient()

  useEffect(() => {
    fetchBuildings()
    fetchServices()
  }, [selectedBuilding])

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('building_code', { ascending: true })

      if (error) throw error
      setBuildings(data || [])
    } catch (error) {
      console.error('Error fetching buildings:', error)
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('services')
        .select(`
          *,
          buildings (
            *,
            projects (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (selectedBuilding !== 'all') {
        query = query.eq('building_id', selectedBuilding)
      }

      const { data, error } = await query

      if (error) throw error

      const servicesWithRelations = (data || []).map((service: any) => ({
        ...service,
        building: service.buildings,
      }))

      setServices(servicesWithRelations)
      // Initialize progress updates with current values
      const updates: { [key: string]: number } = {}
      servicesWithRelations.forEach((service: ServiceWithRelations) => {
        updates[service.id] = service.current_progress
      })
      setProgressUpdates(updates)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProgressChange = (serviceId: string, value: number) => {
    setProgressUpdates((prev) => ({
      ...prev,
      [serviceId]: Math.max(0, Math.min(100, value)),
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update services
      for (const [serviceId, newProgress] of Object.entries(progressUpdates)) {
        const service = services.find((s) => s.id === serviceId)
        if (!service) continue

        const updateData: { current_progress: number } = { current_progress: Number(newProgress) }
        const { error } = await (supabase
          .from('services')
          .update(updateData as never)
          .eq('id', serviceId) as any)
        
        if (error) throw error
      }

      // Update building total progress
      const buildingIds = Array.from(new Set(services.map((s) => s.building_id)))
      for (const buildingId of buildingIds) {
        const buildingServices = services.filter((s) => s.building_id === buildingId)
        const avgProgress =
          buildingServices.reduce((sum, s) => sum + (progressUpdates[s.id] || s.current_progress), 0) /
          buildingServices.length

        const updateData: { total_progress: number } = { total_progress: Number(avgProgress.toFixed(2)) }
        const { error } = await (supabase
          .from('buildings')
          .update(updateData as never)
          .eq('id', buildingId) as any)
        
        if (error) throw error
      }

      await fetchServices()
      alert(t('common.saveSuccess', 'Updates saved successfully'))
    } catch (error) {
      console.error('Error saving updates:', error)
      alert(t('common.saveError', 'Error saving updates'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  return (
    <div>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('completionTracking.title')}</h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">{t('completionTracking.subtitle')}</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4 lg:mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <span className="font-bold">{t('completionTracking.calculationFormula')}:</span> {t('completionTracking.formula')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 mb-4 lg:mb-6">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto justify-center sm:justify-start">
          <Save size={14} className="ml-1 sm:ml-1.5" />
          <span className="text-xs">{saving ? t('completionTracking.saving') : t('completionTracking.saveUpdates')}</span>
        </Button>
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          <option value="all">{t('completionTracking.allBuildings')}</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.building_code}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('completionTracking.service')}
              </th>
              <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('completionTracking.building')}
              </th>
              <th className="hidden lg:table-cell px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('completionTracking.totalPrice')}
              </th>
              <th className="hidden lg:table-cell px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('completionTracking.previousPercentage')}
              </th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('completionTracking.currentPercentage')}
              </th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('completionTracking.currentDue')}
              </th>
              <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('completionTracking.lastUpdate')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {services.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              services.map((service) => {
                const currentProgress = progressUpdates[service.id] ?? service.current_progress
                const totalPrice = service.unit_price * service.quantity
                const currentDue = calculateEarnedValue({
                  unitPrice: service.unit_price,
                  quantity: service.quantity,
                  oldProgress: service.last_invoiced_progress,
                  newProgress: currentProgress,
                })

                return (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 lg:px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{service.description}</div>
                      <div className="text-gray-600 dark:text-gray-500 text-xs">{t('services.lumpSum')}</div>
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {service.building?.building_code === 'الرئيسية' || service.building?.building_code === 'Main'
                            ? t('buildings.mainBuilding')
                            : `${t('buildings.building')} ${service.building?.building_code}`}
                        </div>
                        <div className="text-gray-600 dark:text-gray-500 text-xs">
                          {service.building?.project?.name || t('common.noProject')}
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(totalPrice, 'ILS')}
                    </td>
                    <td className="hidden lg:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-400">
                      {service.last_invoiced_progress.toFixed(0)}%
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={currentProgress}
                          onChange={(e) => handleProgressChange(service.id, parseFloat(e.target.value))}
                          className="w-24 lg:w-32"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-10 lg:w-12 text-left">
                          {currentProgress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(currentDue, 'ILS')}
                    </td>
                    <td className="hidden md:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                      {service.updated_at
                        ? `${formatDate(service.updated_at, 'ar-SA')} - Eng. Ahmed Al-Saleh`
                        : t('common.noUpdate')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

