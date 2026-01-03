'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Invoice, InvoiceItem, Company, Project, Area } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Printer, Download } from 'lucide-react'
import Button from '@/components/shared/Button'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface InvoicePreviewProps {
  invoiceId: string
}

export default function InvoicePreview({ invoiceId }: InvoicePreviewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [area, setArea] = useState<Area | null>(null)
  const [loading, setLoading] = useState(true)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchInvoiceData()
  }, [invoiceId])

  const fetchInvoiceData = async () => {
    try {
      setLoading(true)

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (invoiceError) throw invoiceError
      if (!invoiceData) return
      
      const invoice = invoiceData as Invoice
      setInvoice(invoice)

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError
      setItems((itemsData || []) as InvoiceItem[])

      // Fetch company
      if (invoice.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', invoice.company_id)
          .single()

        if (companyError) throw companyError
        setCompany(companyData as Company)
      }

      // Fetch project
      if (invoice.project_id) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', invoice.project_id)
          .single()

        if (projectError) throw projectError
        const projectTyped = projectData as Project
        setProject(projectTyped)

        // Fetch area for project
        if (projectTyped.area_id) {
          const { data: areaData, error: areaError } = await supabase
            .from('areas')
            .select('*')
            .eq('id', projectTyped.area_id)
            .single()

          if (!areaError && areaData) {
            setArea(areaData as Area)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading invoice...</div>
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return

    try {
      // Use html2canvas to capture the HTML content
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`invoice-${invoice.invoice_number}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('حدث خطأ أثناء إنشاء PDF')
    }
  }

  if (!invoice) {
    return <div className="text-center py-8 text-red-600">Invoice not found</div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-end gap-3">
        <Button onClick={handlePrint} variant="outline">
          <Printer size={18} className="ml-2" />
          طباعة
        </Button>
        <Button onClick={handleDownloadPDF}>
          <Download size={18} className="ml-2" />
          تحميل PDF
        </Button>
      </div>
      <div ref={invoiceRef} className="bg-white" style={{ width: '210mm', minHeight: '297mm', padding: 0, margin: 0 }} dir="ltr">
        {/* Header - Blue bar */}
        <div className="bg-blue-600 text-white p-4" style={{ height: '50px' }}>
          <div className="flex justify-between items-center h-full">
            <div>
              <h1 className="text-2xl font-bold">Bunyan CRM</h1>
            </div>
            <div className="text-right">
              <p className="text-sm">Service Document</p>
              <p className="text-xs">Document Date: {formatDate(invoice.created_at, 'en-US')}</p>
              <p className="text-xs">Invoice Number: {invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Customer Info Box - Light Green */}
        <div className="bg-green-100 p-4 mx-4 mt-4 rounded" style={{ backgroundColor: '#dcfce7' }}>
          <h3 className="font-bold text-sm mb-2">Customer</h3>
          {company && (
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">Name:</span> {company.name}</p>
              {company.phone && <p><span className="font-semibold">Phone:</span> {company.phone}</p>}
              {company.email && <p><span className="font-semibold">Email:</span> {company.email}</p>}
              {company.tax_number && <p><span className="font-semibold">Tax ID:</span> {company.tax_number}</p>}
            </div>
          )}
        </div>

        {/* Invoice Deal Title */}
        <div className="bg-blue-600 text-white p-2 mx-4 mt-4 text-center">
          <h2 className="text-lg font-bold">Invoice Deal</h2>
        </div>

        {/* Items Table */}
        <div className="mx-4 mt-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-right font-bold">الإجمالي</th>
                <th className="border p-2 text-right font-bold">الكمية</th>
                <th className="border p-2 text-right font-bold">الوقت</th>
                <th className="border p-2 text-right font-bold">التاريخ</th>
                <th className="border p-2 text-right font-bold">النسبة</th>
                <th className="border p-2 text-right font-bold">البناية</th>
                <th className="border p-2 text-right font-bold">تفاصيل الخدمة</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-right">{formatCurrency(item.amount_due, 'ILS')}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-center">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="border p-2 text-center">{formatDate(invoice.created_at, 'en-US')}</td>
                  <td className="border p-2 text-center">{item.previous_percentage}% → {item.current_percentage}%</td>
                  <td className="border p-2 text-center">{item.building_code}</td>
                  <td className="border p-2 text-right">{item.service_description}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="border p-2 text-right font-bold">{formatCurrency(invoice.amount, 'ILS')}</td>
                <td colSpan={5} className="border p-2 text-right">الإجمالي قبل الضريبة</td>
              </tr>
              <tr>
                <td className="border p-2 text-right font-bold">{formatCurrency(invoice.amount * 0.18, 'ILS')}</td>
                <td colSpan={5} className="border p-2 text-right">الضريبة (18%)</td>
              </tr>
              <tr className="bg-blue-100">
                <td className="border p-2 text-right font-bold text-lg">{formatCurrency(invoice.amount * 1.18, 'ILS')}</td>
                <td colSpan={5} className="border p-2 text-right font-bold">الإجمالي شامل الضريبة</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Contractor Info Box - Light Blue */}
        <div className="bg-blue-100 p-4 mx-4 mt-4 rounded" style={{ backgroundColor: '#dbeafe' }}>
          <h3 className="font-bold text-sm mb-2">Contractor</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Name:</span> Bunyan Construction</p>
            {project && <p><span className="font-semibold">Project:</span> {project.name}</p>}
            {area && <p><span className="font-semibold">Area:</span> {area.name}</p>}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mx-4 mt-4">
          <h3 className="font-bold text-sm mb-2">⚠ Terms and Conditions</h3>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>The service is provided as agreed and scheduled.</li>
            <li>Any changes must be communicated in advance.</li>
            <li>Invoices are due upon receipt unless otherwise stated.</li>
            <li>Disputes must be raised within 7 days.</li>
            <li>This document is binding once issued.</li>
          </ul>
        </div>

        {/* Signature Section */}
        <div className="mx-4 mt-8 flex justify-between">
          <div className="flex-1">
            <div className="border-t-2 border-gray-400 mt-2 mb-1" style={{ width: '150px' }}></div>
            <p className="text-xs font-semibold">Provider Signature</p>
          </div>
          <div className="flex-1 text-right">
            <div className="border-t-2 border-gray-400 mt-2 mb-1 ml-auto" style={{ width: '150px' }}></div>
            <p className="text-xs font-semibold">Customer's Signature</p>
          </div>
        </div>
      </div>
    </div>
  )
}

