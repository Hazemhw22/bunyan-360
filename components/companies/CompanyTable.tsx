'use client'

import { useState, useEffect } from 'react'
import { useCompanies } from '@/hooks/useCompanies'
import { createClient } from '@/lib/supabaseClient'
import Button from '@/components/shared/Button'
import { Plus, Users, Mail, Phone, User, FileText, MoreVertical } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CompanyTableProps {
  onAddClick: () => void
  onEditClick: (id: string) => void
}

interface CompanyWithStats {
  id: string
  name: string
  tax_number: string | null
  email: string | null
  phone: string | null
  contact_person_name: string | null
  paidAmount: number
  invoicesCount: number
  pendingInvoicesCount: number
  projectsCount: number
}

export default function CompanyTable({ onAddClick, onEditClick }: CompanyTableProps) {
  const { companies, loading, error } = useCompanies()
  const [companiesWithStats, setCompaniesWithStats] = useState<CompanyWithStats[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (companies.length > 0) {
      fetchCompaniesStats()
    } else {
      setCompaniesWithStats([])
      setLoadingStats(false)
    }
  }, [companies])

  const fetchCompaniesStats = async () => {
    try {
      setLoadingStats(true)
      
      const companiesWithStatsData = await Promise.all(
        companies.map(async (company) => {
          // Get invoices
          const { data: invoices } = await supabase
            .from('invoices')
            .select('amount, status')
            .eq('company_id', company.id)

          const invoicesTyped = (invoices || []) as Array<{ amount: number; status: string }>
          const paidInvoices = invoicesTyped.filter(i => i.status === 'paid')
          const pendingInvoices = invoicesTyped.filter(i => i.status === 'sent' || i.status === 'draft')
          const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)

          // Get projects count
          const { count: projectsCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

          return {
            ...company,
            contact_person_name: (company as any).contact_person_name || null,
            paidAmount,
            invoicesCount: invoicesTyped.length,
            pendingInvoicesCount: pendingInvoices.length,
            projectsCount: projectsCount || 0,
          }
        })
      )

      setCompaniesWithStats(companiesWithStatsData)
    } catch (err) {
      console.error('Error fetching company stats:', err)
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
    <div>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">إدارة الشركات</h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">إدارة بيانات الشركات والعملاء</p>
      </div>

      <div className="mb-4 lg:mb-6">
        <Button onClick={onAddClick} className="w-full sm:w-auto justify-center sm:justify-start">
          <Plus size={14} className="ml-1 sm:ml-1.5" />
          <span className="text-xs">إضافة شركة</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {companiesWithStats.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
            لا توجد شركات. انقر "إضافة شركة" لإنشاء واحدة.
          </div>
        ) : (
          companiesWithStats.map((company) => (
            <div
              key={company.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow relative"
            >
              {/* Three dots menu */}
              <div className="absolute top-4 left-4 cursor-pointer">
                <MoreVertical className="text-gray-400 dark:text-gray-500" size={20} />
              </div>

              {/* Company Icon */}
              <div className="absolute top-4 right-4 w-12 h-12 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>

              {/* Company Info */}
              <div className="mb-4 mt-12">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{company.name}</h3>
                {company.tax_number && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    الرقم الضريبي: {company.tax_number}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 text-sm">
                {company.email && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                    <Mail size={16} />
                    <span>{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                    <Phone size={16} />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.contact_person_name && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-400">
                    <User size={16} />
                    <span>{company.contact_person_name}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مدفوع</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(company.paidAmount, 'ILS')}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {company.invoicesCount} {company.invoicesCount === 1 ? 'فاتورة' : 'فاتورة'}
                      </p>
                      {company.pendingInvoicesCount > 0 && (
                        <span className="text-xs text-orange-600 dark:text-orange-400">
                          {company.pendingInvoicesCount} معلقة
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                      {company.projectsCount} {company.projectsCount === 1 ? 'مشروع' : 'مشروع'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

