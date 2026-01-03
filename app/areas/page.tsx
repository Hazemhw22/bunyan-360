'use client'

import { useState } from 'react'
import AreaList from '@/components/areas/AreaList'
import AreaForm from '@/components/areas/AreaForm'

export default function AreasPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>(undefined)

  const handleAddClick = () => {
    setEditingId(undefined)
    setShowForm(true)
  }

  const handleEditClick = (id: string) => {
    setEditingId(id)
    setShowForm(true)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingId(undefined)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(undefined)
  }

  if (showForm) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {editingId ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <AreaForm areaId={editingId} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <AreaList onAddClick={handleAddClick} onEditClick={handleEditClick} />
    </div>
  )
}

