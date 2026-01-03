import type { Metadata } from 'next'
import { getServerClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'
import Header from '@/components/shared/Header'
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
    <html lang="ar" dir="rtl">
      <body>
        {session ? (
          <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-auto">{children}</main>
            </div>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  )
}

