'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'

interface CompanyFormProps {
  companyId?: string
  onSuccess: () => void
  onCancel: () => void
}

export default function CompanyForm({ companyId, onSuccess, onCancel }: CompanyFormProps) {
  const [name, setName] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [contactPersonName, setContactPersonName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (companyId) {
      fetchCompany()
    }
  }, [companyId])

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId!)
        .single()

      if (error) throw error
      if (data) {
        const companyData = data as any
        setName(companyData.name)
        setTaxNumber(companyData.tax_number || '')
        setEmail(companyData.email || '')
        setPhone(companyData.phone || '')
        setContactPersonName(companyData.contact_person_name || '')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (companyId) {
        const { error } = await (supabase
          .from('companies')
          .update({
            name,
            tax_number: taxNumber || null,
            email: email || null,
            phone: phone || null,
            contact_person_name: contactPersonName || null,
          } as never)
          .eq('id', companyId) as any)

        if (error) throw error
      } else {
        const { error } = await (supabase
          .from('companies')
          .insert([
            {
              name,
              tax_number: taxNumber || null,
              email: email || null,
              phone: phone || null,
              contact_person_name: contactPersonName || null,
            } as never,
          ]) as any)

        if (error) throw error
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Input
        label="اسم الشركة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="مثال: شركة البناء المتقدم"
      />

      <Input
        label="الرقم الضريبي"
        value={taxNumber}
        onChange={(e) => setTaxNumber(e.target.value)}
        placeholder="الرقم الضريبي"
      />

      <Input
        label="البريد الإلكتروني"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="company@example.com"
      />

      <Input
        label="الهاتف"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+966 50 123 4567"
      />

      <Input
        label="اسم صاحب الشركة"
        value={contactPersonName}
        onChange={(e) => setContactPersonName(e.target.value)}
        placeholder="مثال: أحمد محمد"
      />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : companyId ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}

