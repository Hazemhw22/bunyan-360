'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n/config'

interface I18nProviderProps {
  children: React.ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Initialize i18n on client side
    const currentLang = localStorage.getItem('i18nextLng') || 'en'
    i18n.changeLanguage(currentLang)
    
    // Update HTML attributes
    if (typeof window !== 'undefined') {
      document.documentElement.lang = currentLang
      document.documentElement.dir = currentLang === 'ar' || currentLang === 'he' ? 'rtl' : 'ltr'
    }

    // Listen for language changes
    const handleLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng
      document.documentElement.dir = lng === 'ar' || lng === 'he' ? 'rtl' : 'ltr'
    }

    i18n.on('languageChanged', handleLanguageChanged)

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [i18n])

  return <>{children}</>
}

