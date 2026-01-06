import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Invoice, Company, Project, Building, Area, Service, InvoiceItem } from '@/types/database'
import { formatCurrency } from './utils'

interface InvoiceDetails {
  invoice: Invoice
  company: Company | undefined
  project: Project | undefined
  building: Building | undefined
  area: Area | undefined
  services: Service[]
  invoiceItems: InvoiceItem[]
}

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'مسودة', color: '#6b7280', bg: '#f3f4f6' },
  pending: { label: 'قيد الانتظار', color: '#d97706', bg: '#fef3c7' },
  paid: { label: 'مدفوعة', color: '#059669', bg: '#d1fae5' },
  overdue: { label: 'متأخرة', color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'ملغاة', color: '#6b7280', bg: '#f3f4f6' },
}

const createInvoiceHTML = (details: InvoiceDetails): string => {
  const { invoice, company, project, building, area, services, invoiceItems } = details
  const status = statusLabels[invoice.status] || statusLabels.draft

  let servicesHTML = ''
  let totalDue = 0

  // Use invoiceItems if available, otherwise calculate from services
  if (invoiceItems.length > 0) {
    invoiceItems.forEach((item, index) => {
      totalDue += item.amount_due

      servicesHTML += `
        <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.service_description}</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.unit_price * item.quantity)}</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.previous_percentage}%</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.current_percentage}%</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${formatCurrency(item.amount_due)}</td>
        </tr>
      `
    })
  } else if (services.length > 0) {
    services.forEach((service, index) => {
      const previousPercent = service.last_invoiced_progress || 0
      const currentPercent = service.current_progress || 0
      const percentDiff = currentPercent - previousPercent
      const amountDue = (service.unit_price * service.quantity * percentDiff) / 100
      totalDue += amountDue

      servicesHTML += `
        <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${service.description}</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${formatCurrency(service.unit_price * service.quantity)}</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${previousPercent}%</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${currentPercent}%</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${formatCurrency(amountDue)}</td>
        </tr>
      `
    })
  }

  if (servicesHTML === '') {
    servicesHTML = `
      <tr>
        <td colspan="5" style="padding: 20px; text-align: center; color: #6b7280;">لا توجد خدمات مرتبطة بهذه الفاتورة</td>
      </tr>
    `
  }

  return `
    <div id="invoice-container" style="
      font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0 auto;
      background: #ffffff;
      color: #1f2937;
    ">
      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        padding: 30px 40px;
        color: white;
        text-align: center;
      ">
        <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">فاتورة ضريبية</h1>
        <p style="margin: 0 0 8px 0; font-size: 18px; opacity: 0.95;">رقم الفاتورة: ${invoice.invoice_number}</p>
        <span style="
          display: inline-block;
          padding: 6px 20px;
          background: ${status.bg};
          color: ${status.color};
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        ">${status.label}</span>
      </div>

      <!-- Dates -->
      <div style="
        display: flex;
        justify-content: space-between;
        padding: 20px 40px;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
      ">
        <div style="text-align: right;">
          <span style="color: #6b7280; font-size: 13px;">تاريخ الإصدار</span>
          <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 15px;">${formatDate(invoice.created_at)}</p>
        </div>
        <div style="text-align: left;">
          <span style="color: #6b7280; font-size: 13px;">تاريخ الاستحقاق</span>
          <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 15px;">${formatDate(invoice.updated_at || invoice.created_at)}</p>
        </div>
      </div>

      <!-- Info Boxes -->
      <div style="display: flex; gap: 20px; padding: 30px 40px;">
        <!-- Company Info -->
        <div style="
          flex: 1;
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        ">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 8px;">بيانات الشركة</h3>
          <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">${company?.name || '-'}</p>
          <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 14px;">الرقم الضريبي: ${company?.tax_number || '-'}</p>
          <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 14px;">جهة الاتصال: ${company?.contact_person_name || '-'}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">الهاتف: ${company?.phone || '-'}</p>
        </div>

        <!-- Project Info -->
        <div style="
          flex: 1;
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        ">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 8px;">بيانات المشروع</h3>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>المنطقة:</strong> ${area?.name || '-'}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>المشروع:</strong> ${project?.name || '-'}</p>
          <p style="margin: 0; font-size: 14px;"><strong>البناية:</strong> ${building?.building_code || '-'}</p>
        </div>
      </div>

      <!-- Services Table -->
      <div style="padding: 0 40px 30px 40px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">تفاصيل الخدمات</h3>
        <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white;">
              <th style="padding: 14px; text-align: right; font-weight: 600;">الخدمة</th>
              <th style="padding: 14px; text-align: center; font-weight: 600;">السعر الإجمالي</th>
              <th style="padding: 14px; text-align: center; font-weight: 600;">النسبة السابقة</th>
              <th style="padding: 14px; text-align: center; font-weight: 600;">النسبة الحالية</th>
              <th style="padding: 14px; text-align: center; font-weight: 600;">المبلغ المستحق</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHTML}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="padding: 0 40px 30px 40px;">
        <div style="
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          padding: 25px;
          border: 1px solid #e5e7eb;
          max-width: 350px;
          margin-right: auto;
        ">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 15px; color: #6b7280;">المبلغ الإجمالي:</span>
            <span style="font-size: 16px; font-weight: 700;">${formatCurrency(invoice.amount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 15px; color: #6b7280;">المبلغ المدفوع:</span>
            <span style="font-size: 16px; font-weight: 700; color: #059669;">${formatCurrency(totalDue)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-size: 15px; color: #6b7280;">المبلغ المتبقي:</span>
            <span style="font-size: 18px; font-weight: 700; color: ${(invoice.amount - totalDue) > 0 ? '#d97706' : '#059669'};">${formatCurrency(invoice.amount - totalDue)}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        text-align: center;
        padding: 20px 40px;
        background: #f8fafc;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 12px;
      ">
        <p style="margin: 0 0 5px 0;">هذه الفاتورة صادرة إلكترونياً وتعتبر صالحة بدون توقيع أو ختم</p>
        <p style="margin: 0;">تم الإنشاء بتاريخ: ${formatDate(new Date())}</p>
      </div>
    </div>
  `
}

export const generateInvoicePDF = async (details: InvoiceDetails) => {
  // Create a hidden container for the invoice HTML
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.innerHTML = createInvoiceHTML(details)
  document.body.appendChild(container)

  try {
    const invoiceElement = container.querySelector('#invoice-container') as HTMLElement
    
    // Use html2canvas to capture the element
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const imgData = canvas.toDataURL('image/png')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    pdf.save(`${details.invoice.invoice_number}.pdf`)
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

