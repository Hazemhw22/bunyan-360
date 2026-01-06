'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabaseClient'
import { Invoice, Company, Project, Building, Area, Service, InvoiceItem } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdfGenerator'
import Link from 'next/link'
import Button from '@/components/shared/Button'
import Badge from '@/components/shared/Badge'
import DropdownMenu, { DropdownMenuItem, DropdownMenuSeparator } from '@/components/shared/DropdownMenu'
import { Plus, FileText, MoreHorizontal, Eye, Download, Printer, CheckCircle2, XCircle } from 'lucide-react'
import { createNotification } from '@/lib/notifications'

interface InvoiceWithRelations extends Invoice {
  company: Company | null
  project: Project | null
  building: Building | null
  area: Area | null
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'secondary' }> = {
  draft: { label: 'مسودة', variant: 'secondary' },
  pending: { label: 'قيد الانتظار', variant: 'warning' },
  sent: { label: 'قيد الانتظار', variant: 'warning' },
  paid: { label: 'مدفوعة', variant: 'success' },
  overdue: { label: 'متأخرة', variant: 'danger' },
  cancelled: { label: 'ملغاة', variant: 'secondary' },
}

export default function InvoicesPage() {
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    fetchInvoices()
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from('companies').select('*').order('name')
      if (error) throw error
      setCompanies((data || []) as Company[])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

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

      // Get areas for projects
      const areaIds = Array.from(
        new Set(
          (projectsResult.data || [])
            .map((p: Project) => p.area_id)
            .filter(Boolean) as string[]
        )
      )

      const { data: areasData } = await supabase.from('areas').select('*').in('id', areaIds)
      const areasMap = new Map((areasData || []).map((a: Area) => [a.id, a]))

      // Get buildings for projects
      const { data: buildingsData } = await supabase
        .from('buildings')
        .select('*')
        .in('project_id', projectIdsArray)

      const buildingsMap = new Map((buildingsData || []).map((b: Building) => [b.project_id, b]))

      const invoicesWithRelations = (data || []).map((invoice: Invoice) => {
        const project = projectsMap.get(invoice.project_id) || null
        return {
          ...invoice,
          company: companiesMap.get(invoice.company_id) || null,
          project,
          building: buildingsMap.get(invoice.project_id) || null,
          area: project?.area_id ? areasMap.get(project.area_id) || null : null,
        }
      })

      // Calculate stats
      const totalAmount = invoicesWithRelations.reduce((sum, inv) => sum + inv.amount, 0)
      const paidInvoices = invoicesWithRelations.filter((i) => i.status === 'paid')
      const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      const pendingAmount = totalAmount - paidAmount

      setStats({
        totalAmount,
        paidAmount,
        pendingAmount,
      })

      setInvoices(invoicesWithRelations)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (invoice: InvoiceWithRelations) => {
    try {
      // Fetch invoice items
      const { data: invoiceItemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      if (itemsError) throw itemsError

      const invoiceItems = (invoiceItemsData || []) as InvoiceItem[]

      // Fetch services if needed
      const serviceIds = invoiceItems
        .map((item) => item.service_id)
        .filter(Boolean) as string[]
      
      let services: Service[] = []
      if (serviceIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds)

        if (!servicesError && servicesData) {
          services = servicesData as Service[]
        }
      }

      await generateInvoicePDF({
        invoice,
        company: invoice.company || undefined,
        project: invoice.project || undefined,
        building: invoice.building || undefined,
        area: invoice.area || undefined,
        services,
        invoiceItems,
      })

      await createNotification({
        title: 'تم تحميل الفاتورة',
        message: `تم تحميل الفاتورة ${invoice.invoice_number} بنجاح`,
        type: 'success',
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      await createNotification({
        title: 'خطأ في تحميل الفاتورة',
        message: 'حدث خطأ أثناء إنشاء ملف PDF',
        type: 'error',
      })
    }
  }

  const handlePrint = async (invoice: InvoiceWithRelations) => {
    await handleDownloadPDF(invoice)
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (statusFilter !== 'all' && invoice.status !== statusFilter) return false
    if (companyFilter !== 'all' && invoice.company_id !== companyFilter) return false
    return true
  })

  const filteredStats = {
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    paidAmount: filteredInvoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pendingAmount: filteredInvoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {t('invoices.title')}
          </h1>
          <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">{t('invoices.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('invoices.allCompanies')}</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('invoices.allStatuses')}</option>
            <option value="draft">{t('invoices.draft')}</option>
            <option value="pending">{t('invoices.pending')}</option>
            <option value="sent">{t('invoices.pending')}</option>
            <option value="paid">{t('invoices.paid')}</option>
          </select>
          <Button>
            <Plus size={16} className="ml-1.5" />
            {t('invoices.newInvoice')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الفواتير</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(filteredStats.totalAmount, 'ILS')}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">المبالغ المحصلة</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(filteredStats.paidAmount, 'ILS')}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">المبالغ المعلقة</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(filteredStats.pendingAmount, 'ILS')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  رقم الفاتورة
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  الشركة
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  المشروع / البناية
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  المبلغ الإجمالي
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  تاريخ الإصدار
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[50px]">
                  {/* Actions column */}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 lg:px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                    {t('dashboard.noInvoices')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const status = statusConfig[invoice.status] || statusConfig.draft

                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            {invoice.invoice_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {invoice.company?.name || '-'}
                        </p>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {invoice.project?.name || '-'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {invoice.area?.name || '-'} • {invoice.building?.building_code || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(invoice.amount, 'ILS')}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                        {formatDate(invoice.created_at, 'ar-SA')}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu
                          trigger={
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          }
                        >
                          <DropdownMenuItem>
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="flex items-center gap-2 w-full"
                            >
                              <Eye className="h-4 w-4" />
                              عرض
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              تحميل PDF
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                            <div className="flex items-center gap-2">
                              <Printer className="h-4 w-4" />
                              طباعة
                            </div>
                          </DropdownMenuItem>
                          {invoice.status === 'pending' || invoice.status === 'sent' ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-green-600 dark:text-green-400">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  تسجيل دفعة
                                </div>
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenu>
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
