import InvoicePreview from '@/components/invoices/InvoicePreview'

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div>
      <InvoicePreviewWrapper params={params} />
    </div>
  )
}

async function InvoicePreviewWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InvoicePreview invoiceId={id} />
}

