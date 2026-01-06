'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import MobileDrawer from './MobileDrawer'
import Header from './Header'

export default function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Close mobile menu when window is resized to desktop size
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="flex-1 flex flex-col w-full min-w-0">
        <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 overflow-auto w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

