'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Service, Building, Invoice, InvoiceItem } from '@/types/database'
import { calculateUnbilledAmount } from '@/lib/calculations'
import { formatCurrency, generateInvoiceNumber } from '@/lib/utils'
import Button from '@/components/shared/Button'

interface InvoiceGeneratorProps {
  projectId: string
  companyId: string
  onInvoiceGenerated: () => void
}

interface UnbilledService extends Service {
  building: Building
  unbilledAmount: number
}

export default function InvoiceGenerator({
  projectId,
  companyId,
  onInvoiceGenerated,
}: InvoiceGeneratorProps) {
  const [unbilledServices, setUnbilledServices] = useState<UnbilledService[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchUnbilledServices()
  }, [projectId])

  const fetchUnbilledServices = async () => {
    try {
      setLoading(true)
      // Get all buildings for this project
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('project_id', projectId)

      if (buildingsError) throw buildingsError

      if (!buildings || buildings.length === 0) {
        setUnbilledServices([])
        return
      }

      const buildingsTyped = buildings as Building[]
      const buildingIds = buildingsTyped.map((b) => b.id)

      // Get all services for these buildings
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .in('building_id', buildingIds)

      if (servicesError) throw servicesError

      // Filter services with unbilled progress and calculate amounts
      const servicesTyped = (services || []) as Service[]
      const unbilled = servicesTyped
        .map((service) => {
          const building = buildingsTyped.find((b) => b.id === service.building_id)
          if (!building) return null
          
          const unbilledAmount = calculateUnbilledAmount(
            service.unit_price,
            service.quantity,
            service.current_progress,
            service.last_invoiced_progress
          )

          return {
            ...service,
            building,
            unbilledAmount,
          }
        })
        .filter((item): item is UnbilledService => item !== null && item.unbilledAmount > 0)

      setUnbilledServices(unbilled)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (unbilledServices.length === 0) return

    try {
      setGenerating(true)
      setError(null)

      // Calculate total amount
      const totalAmount = unbilledServices.reduce((sum, service) => sum + service.unbilledAmount, 0)

      // Generate invoice number
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
      const invoiceNumber = generateInvoiceNumber('INV', (count || 0) + 1)

      // Create invoice
      const invoiceData = {
        company_id: companyId,
        project_id: projectId,
        invoice_number: invoiceNumber,
        amount: totalAmount,
        status: 'draft',
      }

      const { data: invoice, error: invoiceError } = await (supabase
        .from('invoices')
        .insert([invoiceData] as never)
        .select()
        .single() as any)

      if (invoiceError) throw invoiceError
      if (!invoice) throw new Error('فشل إنشاء الفاتورة')

      const invoiceTyped = invoice as Invoice

      // Create invoice items and update services
      const invoiceItems = unbilledServices.map((service) => ({
        invoice_id: invoiceTyped.id,
        service_id: service.id,
        building_code: service.building.building_code,
        service_description: service.description,
        previous_percentage: service.last_invoiced_progress,
        current_percentage: service.current_progress,
        unit_price: service.unit_price,
        quantity: service.quantity,
        amount_due: service.unbilledAmount,
      }))

      const { error: itemsError } = await (supabase.from('invoice_items').insert(invoiceItems as never) as any)

      if (itemsError) throw itemsError

      // Update last_invoiced_progress for all services
      const updatePromises = unbilledServices.map((service) =>
        (supabase
          .from('services')
          .update({ last_invoiced_progress: service.current_progress } as never)
          .eq('id', service.id) as any)
      )

      await Promise.all(updatePromises)

      onInvoiceGenerated()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
      setError(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">جاري تحميل الخدمات غير المفوترة...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-600 dark:text-red-400">خطأ: {error}</div>
  }

  const totalAmount = unbilledServices.reduce((sum, service) => sum + service.unbilledAmount, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">مولد الفواتير</h3>

      {unbilledServices.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">لا توجد خدمات غير مفوترة.</p>
      ) : (
        <>
          <div className="mb-4 space-y-2">
            {unbilledServices.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {service.building.building_code === 'الرئيسية' ? 'البناية الرئيسية' : `البناية ${service.building.building_code}`}:
                  </span>{' '}
                  <span className="text-gray-700 dark:text-gray-400">{service.description}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(service.unbilledAmount, 'ILS')}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {service.last_invoiced_progress}% → {service.current_progress}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">المبلغ الإجمالي:</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalAmount, 'ILS')}</div>
          </div>

          <div className="mt-4">
            <Button onClick={handleGenerateInvoice} disabled={generating} className="w-full">
              {generating ? 'جاري إنشاء الفاتورة...' : 'إنشاء فاتورة'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

