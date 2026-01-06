'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CompanyTable from '@/components/companies/CompanyTable'
import CompanyForm from '@/components/companies/CompanyForm'

export default function CompaniesPage() {
  const { t } = useTranslation()
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
          {editingId ? t('companies.editCompany') : t('companies.addNewCompany')}
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <CompanyForm companyId={editingId} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <CompanyTable onAddClick={handleAddClick} onEditClick={handleEditClick} />
    </div>
  )
}

