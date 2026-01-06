'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabaseClient'
import { Invoice, Company, Project, Building } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Button from '@/components/shared/Button'
import { Plus, FileText, X, CheckCircle, DollarSign } from 'lucide-react'

export default function InvoicesPage() {
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState<(Invoice & { company: Company | null; project: Project | null; building: Building | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingAmount: 0,
    collectedAmount: 0,
    totalInvoices: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch related companies and projects
      const companyIds = Array.from(new Set((data || []).map((i: Invoice) => i.company_id).filter(Boolean)))
      const projectIdsArray = Array.from(new Set((data || []).map((i: Invoice) => i.project_id).filter(Boolean)))

      const [companiesResult, projectsResult] = await Promise.all([
        companyIds.length > 0
          ? supabase.from('companies').select('*').in('id', companyIds)
          : Promise.resolve({ data: [], error: null }),
        projectIdsArray.length > 0
          ? supabase.from('projects').select('*').in('id', projectIdsArray)
          : Promise.resolve({ data: [], error: null }),
      ])

      const companiesMap = new Map((companiesResult.data || []).map((c: Company) => [c.id, c]))
      const projectsMap = new Map((projectsResult.data || []).map((p: Project) => [p.id, p]))

      // Get buildings for projects
      const { data: buildingsData } = await supabase
        .from('buildings')
        .select('*')
        .in('project_id', projectIdsArray)

      const buildingsMap = new Map((buildingsData || []).map((b: Building) => [b.project_id, b]))

      const invoicesWithRelations = (data || []).map((invoice: Invoice) => ({
        ...invoice,
        company: companiesMap.get(invoice.company_id) || null,
        project: projectsMap.get(invoice.project_id) || null,
        building: buildingsMap.get(invoice.project_id) || null,
      }))

      // Calculate stats
      const pendingInvoices = invoicesWithRelations.filter(i => i.status === 'sent' || i.status === 'draft')
      const paidInvoices = invoicesWithRelations.filter(i => i.status === 'paid')
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      const collectedAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)

      setStats({
        pendingAmount,
        collectedAmount,
        totalInvoices: invoicesWithRelations.reduce((sum, inv) => sum + inv.amount, 0),
      })

      setInvoices(invoicesWithRelations)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  return (
    <div>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('invoices.title')}</h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">{t('invoices.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 mb-4 lg:mb-6">
        <Button className="w-full sm:w-auto justify-center sm:justify-start">
          <Plus size={14} className="ml-1 sm:ml-1.5" />
          <span className="text-xs">{t('invoices.newInvoice')}</span>
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto">
            <option>{t('invoices.allStatuses')}</option>
            <option>{t('invoices.paid')}</option>
            <option>{t('invoices.pending')}</option>
            <option>{t('invoices.draft')}</option>
          </select>
          <select className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto">
            <option>{t('invoices.allCompanies')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 lg:px-6 py-2.5 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('invoices.invoiceNumber')}
              </th>
              <th className="hidden sm:table-cell px-3 lg:px-6 py-2.5 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('invoices.totalAmount')}
              </th>
              <th className="px-3 lg:px-6 py-2.5 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('invoices.status')}
              </th>
              <th className="px-3 lg:px-6 py-2.5 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 lg:px-6 py-3 text-center text-gray-600 dark:text-gray-400">
                  {t('dashboard.noInvoices')}
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoice_number}</div>
                      <div className="hidden sm:block mt-1 text-xs font-medium text-gray-700 dark:text-gray-400">
                        {formatCurrency(invoice.amount, 'ILS')}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 lg:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.amount, 'ILS')}
                    </td>
                    <td className="px-3 lg:px-6 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                            : invoice.status === 'sent'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {invoice.status === 'paid' ? t('invoices.paid') : invoice.status === 'sent' ? t('invoices.pending') : t('invoices.draft')}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 px-2 py-1 rounded transition-colors text-xs sm:text-sm"
                      >
                        {t('invoices.view')}
                      </Link>
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

