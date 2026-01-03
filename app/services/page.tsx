'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Service, Building, Project } from '@/types/database'
import Button from '@/components/shared/Button'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import ServiceForm from '@/components/services/ServiceForm'

interface ServiceWithRelations extends Service {
  building: Building & { project: Project | null } | null
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    fetchBuildings()
    fetchServices()
  }, [selectedBuilding])

  const handleEdit = (serviceId: string) => {
    setEditingServiceId(serviceId)
    setShowForm(true)
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return

    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId)
      if (error) throw error
      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('حدث خطأ أثناء حذف الخدمة')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingServiceId(undefined)
    fetchServices()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingServiceId(undefined)
  }

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
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (showForm) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {editingServiceId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <ServiceForm
            serviceId={editingServiceId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">جاري التحميل...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">إدارة الخدمات</h1>
        <p className="text-gray-700 dark:text-gray-400">تسعير الخدمات والأعمال داخل البنايات</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => setShowForm(true)}>
          <Plus size={20} className="ml-2" />
          إضافة خدمة
        </Button>
        <select
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">جميع البنايات</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.building_code}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                الخدمة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                البناية
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                سعر الوحدة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                الكمية
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                الإجمالي
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                نسبة الإنجاز
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {services.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                  لا توجد خدمات
                </td>
              </tr>
            ) : (
              services.map((service, index) => {
                const total = service.unit_price * service.quantity
                return (
                  <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 dark:text-gray-500">🔧</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{service.description}</div>
                          <div className="text-gray-600 dark:text-gray-500 text-xs">مقطوعية</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {service.building?.building_code === 'الرئيسية'
                            ? 'البناية الرئيسية'
                            : `البناية ${service.building?.building_code}`}
                        </div>
                        <div className="text-gray-600 dark:text-gray-500 text-xs">
                          {service.building?.project?.name || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(service.unit_price, 'ILS')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                      {service.quantity} مقطوعية
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(total, 'ILS')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                            style={{ width: `${service.current_progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-left">
                          {service.current_progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(service.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

