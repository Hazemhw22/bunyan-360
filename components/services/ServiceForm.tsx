'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Building } from '@/types/database'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'

interface ServiceFormProps {
  serviceId?: string
  buildingId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ServiceForm({ serviceId, buildingId, onSuccess, onCancel }: ServiceFormProps) {
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildingId || '')
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchBuildings()
    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('building_code', { ascending: true })

      if (error) throw error
      setBuildings(data || [])
    } catch (err: any) {
      console.error('Error fetching buildings:', err)
    }
  }

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId!)
        .single()

      if (error) throw error
      if (data) {
        const serviceData = data as any
        setDescription(serviceData.description)
        setUnitPrice(serviceData.unit_price.toString())
        setQuantity(serviceData.quantity.toString())
        setSelectedBuildingId(serviceData.building_id)
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
      if (!selectedBuildingId) {
        throw new Error('يرجى اختيار البناية')
      }

      if (serviceId) {
        const { error } = await (supabase
          .from('services')
          .update({
            description,
            unit_price: parseFloat(unitPrice),
            quantity: parseFloat(quantity),
            building_id: selectedBuildingId,
          } as never)
          .eq('id', serviceId) as any)

        if (error) throw error
      } else {
        const { error } = await (supabase
          .from('services')
          .insert([
            {
              description,
              unit_price: parseFloat(unitPrice),
              quantity: parseFloat(quantity),
              building_id: selectedBuildingId,
            } as never,
          ]) as any)

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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          البناية
        </label>
        <select
          value={selectedBuildingId}
          onChange={(e) => setSelectedBuildingId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">اختر البناية</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.building_code}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="وصف الخدمة"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        placeholder="مثال: أعمال الهيكل الخرساني"
      />

      <Input
        label="سعر الوحدة"
        type="number"
        value={unitPrice}
        onChange={(e) => setUnitPrice(e.target.value)}
        required
        placeholder="0"
        min="0"
        step="0.01"
      />

      <Input
        label="الكمية"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
        placeholder="1"
        min="0"
        step="0.01"
      />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : serviceId ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}

