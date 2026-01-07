'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabaseClient'
import { Profile } from '@/types/database'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/shared/Badge'
import { Users, Mail, User, Calendar } from 'lucide-react'

export default function UsersPage() {
  const { t, i18n } = useTranslation()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers((data || []) as Profile[])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 dark:text-gray-300">{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {t('users.title')}
          </h1>
          <p className="text-sm lg:text-base text-gray-700 dark:text-gray-400">
            {t('users.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {users.length} {t('users.user')}
            </span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-2 lg:px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('users.username')}
                </th>
                <th className="px-2 lg:px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('users.email')}
                </th>
                <th className="px-2 lg:px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('users.role')}
                </th>
                <th className="hidden lg:table-cell px-2 lg:px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('users.registrationDate')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 lg:px-3 py-6 text-center text-gray-600 dark:text-gray-400 text-sm">
                    {t('users.noUsers')}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-2 lg:px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {user.username || t('users.noName')}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 lg:px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-2 lg:px-3 py-2 whitespace-nowrap">
                      <Badge variant={user.role === 'admin' ? 'success' : 'default'}>
                        {user.role === 'admin' ? t('users.systemAdmin') : user.role}
                      </Badge>
                    </td>
                    <td className="hidden lg:table-cell px-2 lg:px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-400">
                          {formatDate(user.created_at, i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'he' ? 'he-IL' : 'en-US')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

