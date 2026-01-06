import type { Metadata } from 'next'
import { getServerClient } from '@/lib/supabase/server'
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar'
import I18nProvider from '@/components/shared/I18nProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bunyan CRM - Construction Management System',
  description: 'Progress-based pricing and billing system',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = getServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en" dir="ltr">
      <body>
        <I18nProvider>
          {session ? (
            <LayoutWithSidebar>{children}</LayoutWithSidebar>
          ) : (
            <main>{children}</main>
          )}
        </I18nProvider>
      </body>
    </html>
  )
}

