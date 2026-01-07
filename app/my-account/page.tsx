'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabaseClient'
import { Profile } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { UserCircle, Mail, Calendar, Shield } from 'lucide-react'
import Badge from '@/components/shared/Badge'

export default function MyAccountPage() {
  const { t, i18n } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        setProfile(data as Profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">{t('myAccount.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {t('myAccount.title')}
        </h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">
          {t('myAccount.subtitle')}
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <UserCircle className="h-10 w-10" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {profile.username || t('users.noName')}
              </h2>
              <Badge variant={profile.role === 'admin' ? 'success' : 'default'}>
                {profile.role === 'admin' ? t('myAccount.systemAdmin') : profile.role}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('myAccount.email')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('myAccount.role')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {profile.role === 'admin' ? t('myAccount.systemAdmin') : profile.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('myAccount.registrationDate')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(profile.created_at, i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'he' ? 'he-IL' : 'en-US')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

