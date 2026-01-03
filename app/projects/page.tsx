'use client'

import { useState } from 'react'
import ProjectGrid from '@/components/projects/ProjectGrid'
import ProjectForm from '@/components/projects/ProjectForm'
import Button from '@/components/shared/Button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const router = useRouter()

  const handleAddClick = () => {
    setShowForm(true)
  }

  const handleViewClick = (id: string) => {
    router.push(`/projects/${id}`)
  }

  const handleToggleView = () => {
    setShowGrid(!showGrid)
  }

  const handleSuccess = () => {
    setShowForm(false)
  }

  const handleCancel = () => {
    setShowForm(false)
  }

  if (showForm) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">إضافة مشروع جديد</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <ProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  return (
    <div>
      {showGrid ? (
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">إدارة المشاريع</h1>
            <p className="text-gray-700 dark:text-gray-400">متابعة وإدارة جميع المشاريع</p>
          </div>
          <div className="flex justify-between items-center mb-6">
            <Button onClick={handleAddClick}>
              <Plus size={20} className="ml-2" />
              مشروع جديد
            </Button>
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>جميع المشاريع</option>
            </select>
          </div>
          <ProjectGrid />
        </div>
      ) : null}
    </div>
  )
}
