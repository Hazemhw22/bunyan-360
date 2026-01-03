'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MapPin,
  Building2,
  FolderKanban,
  FileText,
  Wrench,
  TrendingUp,
  Settings,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import ProjectLogo from './ProjectLogo'

const menuItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/areas', label: 'المناطق', icon: MapPin },
  { href: '/projects', label: 'المشاريع', icon: FolderKanban },
  { href: '/buildings', label: 'البنايات', icon: Building2 },
  { href: '/services', label: 'الخدمات', icon: Wrench },
  { href: '/companies', label: 'الشركات', icon: Building2 },
  { href: '/completion-tracking', label: 'تتبع الإنجاز', icon: TrendingUp },
  { href: '/invoices', label: 'الفواتير', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState.toString())
  }

  return (
    <div
      className={`bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 min-h-screen flex flex-col border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header with Logo and Toggle Button */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <ProjectLogo />
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">بنيان 360</h1>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isCollapsed ? 'فتح القائمة' : 'إغلاق القائمة'}
          >
            {isCollapsed ? (
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-green-600 dark:bg-green-700 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Settings Link */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'الإعدادات' : ''}
        >
          <Settings size={20} />
          {!isCollapsed && <span>الإعدادات</span>}
        </Link>
      </div>
    </div>
  )
}

