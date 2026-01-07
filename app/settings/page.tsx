'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Globe, Bell } from 'lucide-react'
import Button from '@/components/shared/Button'
import { createNotification } from '@/lib/notifications'

export default function SettingsPage() {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [language, setLanguage] = useState('ar')

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // Check for saved language preference
    const savedLang = localStorage.getItem('i18nextLng') || 'ar'
    setLanguage(savedLang)
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
    
    createNotification({
      title: t('settings.modeChanged'),
      message: `${t('settings.modeChangedMessage')} ${newMode ? t('settings.darkMode') : t('settings.lightMode')}`,
      type: 'success',
    })
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {t('settings.title')}
        </h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            {isDarkMode ? (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.appearance')}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('settings.appearanceTitle')} {isDarkMode ? t('settings.darkMode') : t('settings.lightMode')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {isDarkMode ? t('settings.darkModeActive') : t('settings.lightModeActive')}
              </p>
            </div>
            <Button onClick={toggleDarkMode} variant="outline">
              {isDarkMode ? (
                <>
                  <Sun size={16} className="ml-1.5" />
                  {t('settings.enableLightMode')}
                </>
              ) : (
                <>
                  <Moon size={16} className="ml-1.5" />
                  {t('settings.enableDarkMode')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.language')}</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('settings.languageTitle')}
            </p>
            <div className="flex gap-3">
              <Button
                variant={language === 'ar' ? 'primary' : 'outline'}
                onClick={() => handleLanguageChange('ar')}
                className="flex-1"
              >
                🇸🇦 العربية
              </Button>
              <Button
                variant={language === 'he' ? 'primary' : 'outline'}
                onClick={() => handleLanguageChange('he')}
                className="flex-1"
              >
                🇮🇱 עברית
              </Button>
              <Button
                variant={language === 'en' ? 'primary' : 'outline'}
                onClick={() => handleLanguageChange('en')}
                className="flex-1"
              >
                🇬🇧 English
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.notifications')}</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('settings.notificationsTitle')}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.emailNotifications')}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings.systemNotifications')}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

