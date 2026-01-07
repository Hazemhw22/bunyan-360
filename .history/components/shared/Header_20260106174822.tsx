'use client'

import { Search, User, Sun, Moon, LogOut, UserCircle, Settings, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabaseClient'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationDropdown from './NotificationDropdown'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('مدير نظام')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const isRTL = i18n.language === 'ar' || i18n.language === 'he'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserEmail(user.email || null)
        
        // Fetch profile from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, role, email')
          .eq('user_id', user.id)
          .single()

        if (!error && profile) {
          // Use username from profile, fallback to email
          setUserName(profile.username || profile.email || user.email || null)
          setUserEmail(profile.email || user.email || null)
          // Translate role
          if (profile.role === 'admin') {
            setUserRole('مدير نظام')
          } else {
            setUserRole(profile.role || 'مدير نظام')
          }
        } else {
          // Fallback to email if profile not found
          setUserName(user.email || null)
          setUserEmail(user.email || null)
        }
      }
    }
    getUser()

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }


  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-gray-100 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6 lg:py-4 w-full flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-4 flex-row-reverse">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="فتح القائمة"
            >
              <Menu size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <button className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Search size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="البحث في المشاريع، الشركات، الفواتير..."
              className="pr-10 pl-4 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-64 lg:w-96 text-right text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-row-reverse">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDarkMode ? (
              <Sun size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Profile with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 pr-3 border-r border-gray-200 dark:border-gray-700 flex-row-reverse hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight">{userName || userEmail || 'User'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{userRole}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50`}>
                <div className="py-2">
                  <button className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 flex-row-reverse">
                    <UserCircle size={18} className="text-gray-600 dark:text-gray-400" />
                    {t('common.myAccount', 'My Account')}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 flex-row-reverse"
                  >
                    <User size={18} className="text-gray-600 dark:text-gray-400" />
                    {t('common.profile', 'Profile')}
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 flex-row-reverse"
                  >
                    <Settings size={18} className="text-gray-600 dark:text-gray-400" />
                    {t('common.settings', 'Settings')}
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <div className="flex justify-center">
                    <button
                      onClick={handleLogout}
                      className="w-60 text-center px-4 py-2 text-sm bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800 rounded-lg flex items-center gap-3 flex-row-reverse justify-center"
                    >
                      <LogOut size={18} />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
