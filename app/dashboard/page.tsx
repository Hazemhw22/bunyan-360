'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabaseClient'
import { Invoice, Project, Company, Area } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { TrendingUp, FileText, Wallet, FolderKanban, MapPin } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    totalProgress: 45,
    pendingAmount: 0,
    totalRevenue: 0,
    activeProjects: 0,
    totalInvoices: 0,
    totalProjects: 0,
    totalAreas: 0,
  })
  const [latestInvoices, setLatestInvoices] = useState<(Invoice & { company: Company | null; project: Project | null })[]>([])
  const [activeProjects, setActiveProjects] = useState<(Project & { area: Area | null; company: Company | null })[]>([])
  const [projectStatusData, setProjectStatusData] = useState<{ name: string; value: number; color: string }[]>([])
  const [revenueTrendData, setRevenueTrendData] = useState<{ date: string; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [
        allProjectsResult,
        activeProjectsResult,
        latestProjectsResult,
        allInvoicesResult,
        latestInvoicesResult,
        areasResult,
        companiesResult,
        buildingsResult,
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*, areas(*), companies(*)').eq('status', 'active').limit(5),
        supabase.from('invoices').select('*'),
        supabase.from('invoices').select('*, companies(*), projects(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from('areas').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('buildings').select('total_progress'),
      ])

      // Calculate stats
      const allInvoices = allInvoicesResult.data || []
      const buildings = buildingsResult.data || []

      const avgProgress = buildings.length > 0
        ? buildings.reduce((sum: number, b: any) => sum + (b.total_progress || 0), 0) / buildings.length
        : 0

      const pendingInvoices = allInvoices.filter((i: any) => i.status === 'sent' || i.status === 'draft')
      const pendingAmount = pendingInvoices.reduce((sum, inv: any) => sum + inv.amount, 0)

      const paidInvoices = allInvoices.filter((i: any) => i.status === 'paid')
      const totalRevenue = paidInvoices.reduce((sum, inv: any) => sum + inv.amount, 0)

      setStats({
        totalProgress: avgProgress,
        pendingAmount,
        totalRevenue,
        activeProjects: activeProjectsResult.count || 0,
        totalInvoices: allInvoices.length,
        totalProjects: allProjectsResult.data?.length || 0,
        totalAreas: areasResult.count || 0,
      })

      // Prepare project status data for pie chart
      const allProjects = allProjectsResult.data || []
      const statusCounts: { [key: string]: number } = {}
      allProjects.forEach((project: any) => {
        const status = project.status || 'active'
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })

      const statusColors: { [key: string]: string } = {
        active: '#10b981', // green
        completed: '#3b82f6', // blue
        on_hold: '#f59e0b', // orange
      }

      const statusLabels: { [key: string]: string } = {
        active: t('dashboard.status.active'),
        completed: t('dashboard.status.completed'),
        on_hold: t('dashboard.status.onHold'),
      }

      const projectStatusChartData = Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          name: statusLabels[status] || status,
          value: count,
          color: statusColors[status] || '#6b7280',
        }))
      
      console.log('Project Status Data:', projectStatusChartData)
      console.log('All Projects:', allProjects.length)
      setProjectStatusData(projectStatusChartData)

      // Prepare revenue trend data (last 30 days or all time if no recent data)
      const revenueByDate: { [key: string]: number } = {}
      
      // Use all invoices for revenue trend to show all business activity
      // This includes paid (actual revenue), sent (expected revenue), and draft (pending)
      const invoicesForTrend = allInvoices.length > 0 ? allInvoices : []
      
      // Determine date range based on invoice dates
      let startDate = new Date()
      let endDate = new Date()
      
      if (invoicesForTrend.length > 0) {
        // Find earliest and latest invoice dates
        const invoiceDates = invoicesForTrend
          .map((inv: any) => inv.created_at ? new Date(inv.created_at) : null)
          .filter((date: Date | null) => date !== null && !isNaN(date.getTime())) as Date[]
        
        if (invoiceDates.length > 0) {
          const earliestDate = new Date(Math.min(...invoiceDates.map(d => d.getTime())))
          const latestDate = new Date(Math.max(...invoiceDates.map(d => d.getTime())))
          
          // Set start date to 30 days before latest invoice, or earliest invoice if less than 30 days
          const daysBetween = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))
          const daysToShow = Math.min(Math.max(daysBetween + 1, 1), 30) // Show 1-30 days
          
          startDate = new Date(latestDate)
          startDate.setDate(startDate.getDate() - (daysToShow - 1))
          startDate.setHours(0, 0, 0, 0)
          
          endDate = new Date(latestDate)
          endDate.setHours(23, 59, 59, 999)
        } else {
          // No valid dates, show last 30 days
          startDate.setDate(startDate.getDate() - 30)
          startDate.setHours(0, 0, 0, 0)
        }
      } else {
        // No invoices, show last 30 days
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
      }

      // Process all invoices - include ALL invoices regardless of date for now
      invoicesForTrend.forEach((inv: any) => {
        if (inv.created_at) {
          const invDate = new Date(inv.created_at)
          if (!isNaN(invDate.getTime())) {
            invDate.setHours(0, 0, 0, 0)
            const dateKey = invDate.toISOString().split('T')[0]
            revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (inv.amount || 0)
          }
        }
      })

      // Generate dates for the range - use actual invoice date range
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const numDays = Math.min(Math.max(daysDiff + 1, 1), 30) // Show 1-30 days
      
      const revenueTrendChartData: { date: string; revenue: number }[] = []
      for (let i = 0; i < numDays; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        date.setHours(0, 0, 0, 0)
        const dateKey = date.toISOString().split('T')[0]
        const month = date.toLocaleDateString('ar-SA', { month: 'short' })
        const day = date.getDate()
        revenueTrendChartData.push({
          date: `${month} ${day}`,
          revenue: revenueByDate[dateKey] || 0,
        })
      }
      
      console.log('=== Revenue Trend Debug ===')
      console.log('All Invoices Count:', allInvoices.length)
      console.log('Invoices for Trend:', invoicesForTrend.length)
      console.log('Paid Invoices:', paidInvoices.length)
      console.log('Start Date:', startDate.toISOString())
      console.log('Revenue by Date:', revenueByDate)
      console.log('Revenue Trend Data:', revenueTrendChartData)
      console.log('Total Revenue in Chart:', revenueTrendChartData.reduce((sum, d) => sum + d.revenue, 0))
      console.log('Sample Invoice:', allInvoices[0])
      setRevenueTrendData(revenueTrendChartData)

      // Set latest invoices with relations (only 5)
      const latestInvoices = latestInvoicesResult.data || []
      const invoicesWithRelations = latestInvoices.map((invoice: any) => ({
        ...invoice,
        company: invoice.companies,
        project: invoice.projects,
      }))
      setLatestInvoices(invoicesWithRelations)

      // Set active projects with relations (only 5)
      const latestProjects = latestProjectsResult.data || []
      const projectsWithRelations = latestProjects.map((project: any) => ({
        ...project,
        area: project.areas,
        company: project.companies,
      }))
      setActiveProjects(projectsWithRelations)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'sent':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة'
      case 'sent':
        return 'قيد الانتظار'
      default:
        return 'مسودة'
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  return (
    <div>
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">{t('dashboard.subtitle')}</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('dashboard.totalProgress')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProgress.toFixed(0)}%</p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
                <TrendingUp size={14} />
                5% {t('dashboard.fromLastMonth')}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('dashboard.pendingAmount')}</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.pendingAmount, 'ILS')}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                {latestInvoices.filter((i) => i.status === 'sent' || i.status === 'draft').length} {t('dashboard.pendingInvoices')}
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
              <FileText className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('dashboard.totalRevenue')}</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue, 'ILS')}</p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
                <TrendingUp size={14} />
                8% {t('dashboard.fromLastMonth')}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <Wallet className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('dashboard.activeProjects')}</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.activeProjects}</p>
              <p className="text-green-600 dark:text-green-400 text-sm mt-2 flex items-center gap-1">
                <TrendingUp size={14} />
                12% {t('dashboard.fromLastMonth')}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <FolderKanban className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('dashboard.totalInvoices')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalInvoices}</p>
            </div>
            <FileText className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('dashboard.totalProjects')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProjects}</p>
            </div>
            <FolderKanban className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{t('dashboard.areas')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalAreas}</p>
            </div>
            <MapPin className="text-green-600 dark:text-green-400" size={24} />
          </div>
        </div>
      </div>

      {/* Latest Invoices and Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Latest Invoices */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="text-blue-600 dark:text-blue-400" size={20} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.latestInvoices')}</h2>
            </div>
            <Link href="/invoices" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <div className="p-4 lg:p-6">
            {latestInvoices.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">{t('dashboard.noInvoices')}</p>
            ) : (
              <div className="space-y-4">
                {latestInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <FileText className="text-gray-400 dark:text-gray-500" size={20} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-400">
                          {invoice.company?.name} • {invoice.project?.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-500">{formatDate(invoice.created_at, 'ar-SA')}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.amount, 'ILS')}</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FolderKanban className="text-purple-600 dark:text-purple-400" size={20} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.activeProjects')}</h2>
            </div>
            <Link href="/projects" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <div className="p-4 lg:p-6">
            {activeProjects.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">{t('dashboard.noActiveProjects')}</p>
            ) : (
              <div className="space-y-4">
                {activeProjects.map((project) => {
                  // Calculate project progress from buildings
                  return (
                    <div key={project.id} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{project.name}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-400 mb-2">
                        {project.area?.name} - {project.company?.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                            style={{ width: `${stats.totalProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12 text-left">
                          {stats.totalProgress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section - Below Latest Invoices and Active Projects */}
      {(projectStatusData.length > 0 || (revenueTrendData.length > 0 && revenueTrendData.some(d => d.revenue > 0))) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 lg:mt-6">
          {/* Project Status Chart */}
          {projectStatusData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.projectStatus')}</h2>
                <Link href="/projects" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  ← {t('dashboard.viewAll')}
                </Link>
              </div>
              <div className="p-4 lg:p-6">
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} (${value})`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {projectStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.name} ({entry.value})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Trend Chart */}
          {revenueTrendData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.revenueTrend')}</h2>
                <Link href="/invoices" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  ← {t('dashboard.viewDetails')}
                </Link>
              </div>
              <div className="p-4 lg:p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      className="dark:stroke-gray-400"
                      tick={{ fill: '#6b7280' }}
                      tickFormatter={(value) => `₪${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      offset={10}
                      formatter={(value: number | undefined) => [
                        value !== undefined ? `₪${value.toLocaleString()}` : '₪0',
                        'الإيرادات',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6, offset: 10 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
