'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Building } from '@/types/database'
import BOQTable from '@/components/buildings/BOQTable'
import Button from '@/components/shared/Button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import Input from '@/components/shared/Input'

export default function BuildingDetailPage() {
  const params = useParams()
  const buildingId = params.id as string
  const [building, setBuilding] = useState<Building | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddService, setShowAddService] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchBuilding()
  }, [buildingId])

  const fetchBuilding = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('buildings')
        .select('*, projects!inner(*)')
        .eq('id', buildingId)
        .single()

      if (error) throw error
      setBuilding(data as any)
    } catch (error) {
      console.error('Error fetching building:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async (serviceData: {
    description: string
    unitPrice: number
    quantity: number
  }) => {
    try {
      const { error } = await supabase.from('services').insert([
        {
          building_id: buildingId,
          description: serviceData.description,
          unit_price: serviceData.unitPrice,
          quantity: serviceData.quantity,
          current_progress: 0,
          last_invoiced_progress: 0,
        },
      ])

      if (error) throw error
      setShowAddService(false)
      setRefreshKey(prev => prev + 1) // Trigger refresh in BOQTable
    } catch (error) {
      console.error('Error adding service:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">جاري التحميل...</div>
  }

  if (!building) {
    return <div className="text-center py-8 text-red-600 dark:text-red-400">البناية غير موجودة</div>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/projects/${(building as any).projects.id}`}>
          <Button variant="outline">
            <ArrowLeft size={20} className="ml-2" />
            رجوع للمشروع
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {building.building_code === 'الرئيسية' ? 'البناية الرئيسية' : `البناية ${building.building_code}`}
        </h1>
      </div>

      {showAddService && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <ServiceForm
            onAdd={handleAddService}
            onCancel={() => setShowAddService(false)}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">الخدمات (BOQ)</h2>
          {!showAddService && (
            <Button onClick={() => setShowAddService(true)}>
              <Plus size={20} className="ml-2" />
              إضافة خدمة
            </Button>
          )}
        </div>
      </div>

      <BOQTable key={refreshKey} buildingId={buildingId} buildingCode={building.building_code} />
    </div>
  )
}

function ServiceForm({
  onAdd,
  onCancel,
}: {
  onAdd: (data: { description: string; unitPrice: number; quantity: number }) => void
  onCancel: () => void
}) {
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [quantity, setQuantity] = useState('1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      description,
      unitPrice: parseFloat(unitPrice),
      quantity: parseFloat(quantity) || 1,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">إضافة خدمة جديدة</h3>
      <Input
        label="الوصف"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        placeholder="مثال: حفر، سباكة، تشطيب"
      />
      <Input
        label="سعر الوحدة"
        type="number"
        step="0.01"
        value={unitPrice}
        onChange={(e) => setUnitPrice(e.target.value)}
        required
        placeholder="0.00"
      />
      <Input
        label="الكمية"
        type="number"
        step="0.01"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
        placeholder="1"
      />
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">إضافة خدمة</Button>
      </div>
    </form>
  )
}

