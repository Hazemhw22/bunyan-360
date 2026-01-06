'use client'

import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const languages = [
    { code: 'en', name: 'English', flag: 'EN' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
  ]

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode).then(() => {
      // Update HTML dir and lang attributes
      if (typeof window !== 'undefined') {
        document.documentElement.lang = langCode
        document.documentElement.dir = langCode === 'ar' || langCode === 'he' ? 'rtl' : 'ltr'
      }
    })
  }

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Change Language"
      >
        <Globe size={18} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
          {currentLanguage.flag} 
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:hidden">
          {currentLanguage.flag}
        </span>
      </button>
      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full text-right px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
              i18n.language === lang.code
                ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <span>{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {i18n.language === lang.code && (
              <span className="text-blue-600 dark:text-blue-400">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

