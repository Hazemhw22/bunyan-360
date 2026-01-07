'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabaseClient'
import { Profile } from '@/types/database'
import { formatDate } from '@/lib/utils'
import Input from '@/components/shared/Input'
import Button from '@/components/shared/Button'
import { User, Mail, Save } from 'lucide-react'
import { createNotification } from '@/lib/notifications'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        setUsername(data.username || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', profile.id)

      if (error) throw error

      await createNotification({
        title: t('profile.updateSuccess'),
        message: t('profile.updateSuccessMessage'),
        type: 'success',
      })

      fetchProfile()
    } catch (error: any) {
      await createNotification({
        title: t('profile.updateError'),
        message: error.message || t('profile.updateErrorMessage'),
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">{t('profile.notFound')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {t('profile.title')}
        </h1>
        <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('profile.profileInfo')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('profile.lastUpdate')}: {formatDate(profile.updated_at || profile.created_at, i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'he' ? 'he-IL' : 'en-US')}
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Input
                label={t('profile.username')}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('profile.usernamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('profile.email')}
              </label>
              <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{profile.email}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('profile.emailCannotChange')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="submit" disabled={saving}>
              <Save size={16} className="ml-1.5" />
              {saving ? t('profile.saving') : t('profile.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

