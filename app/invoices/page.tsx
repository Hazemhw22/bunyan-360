'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Invoice, Company, Project, Building } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Button from '@/components/shared/Button'
import { Plus, FileText, X, CheckCircle, DollarSign } from 'lucide-react'

export default function InvoicesPage() {
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
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">جاري التحميل...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">إدارة الفواتير</h1>
        <p className="text-gray-700 dark:text-gray-400">إنشاء وتتبع فواتير المشاريع</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المبالغ المعلقة</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(stats.pendingAmount, 'ILS')}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
              <X className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المبالغ المحصلة</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.collectedAmount, 'ILS')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">إجمالي الفواتير</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(stats.totalInvoices, 'ILS')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center mb-6">
        <Button>
          <Plus size={20} className="ml-2" />
          فاتورة جديدة
        </Button>
        <div className="flex gap-3">
          <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>جميع الحالات</option>
            <option>مدفوعة</option>
            <option>قيد الانتظار</option>
            <option>مسودة</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>جميع الشركات</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                رقم الفاتورة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                الشركة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                المشروع / البناية
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                المبلغ الإجمالي
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                المدفوع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                المتبقي
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                تاريخ الإصدار
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                  لا توجد فواتير.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const paidAmount = invoice.status === 'paid' ? invoice.amount : 0
                const remainingAmount = invoice.amount - paidAmount
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="text-gray-400" size={18} />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                      {invoice.company?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-400">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {invoice.project?.name || '-'}
                        </div>
                        {invoice.building && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {invoice.project?.area_id ? 'منطقة' : ''} • {invoice.building.building_code}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(invoice.amount, 'ILS')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                      {paidAmount > 0 ? formatCurrency(paidAmount, 'ILS') : '- ₪'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                      {remainingAmount > 0 ? formatCurrency(remainingAmount, 'ILS') : '- ₪'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-400">
                      {formatDate(invoice.created_at, 'ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                            : invoice.status === 'sent'
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'sent' ? 'قيد الانتظار' : 'مسودة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        عرض
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
  )
}

