'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNotifications } from '@/hooks/useNotifications'
import { Notification } from '@/types/database'
import { useRouter } from 'next/navigation'
import { CheckCheck, X, ExternalLink, Trash2, Bell } from 'lucide-react'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)

    if (minutes < 1) return t('notifications.justNow', 'الآن')
    if (minutes < 60) return `${minutes} ${t('notifications.minutesAgo', 'دقيقة')}`
    if (hours < 24) return `${hours} ${t('notifications.hoursAgo', 'ساعة')}`
    if (days < 7) return `${days} ${t('notifications.daysAgo', 'يوم')}`
    if (weeks < 4) return `${weeks} ${t('notifications.weeksAgo', 'أسبوع')}`
    if (months < 12) return `${months} ${t('notifications.monthsAgo', 'شهر')}`
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'success':
        return t('notifications.typeSuccess', 'نجاح')
      case 'warning':
        return t('notifications.typeWarning', 'تحذير')
      case 'error':
        return t('notifications.typeError', 'خطأ')
      case 'info':
      default:
        return t('notifications.typeInfo', 'معلومات')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading', 'جاري التحميل...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('notifications.title', 'الإشعارات')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('notifications.subtitle', 'عرض وإدارة جميع الإشعارات')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              <CheckCheck size={18} />
              {t('notifications.markAllRead', 'تحديد الكل كمقروء')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('notifications.all', 'الكل')} ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            filter === 'unread'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('notifications.unread', 'غير مقروء')} ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            {filter === 'unread'
              ? t('notifications.noUnreadNotifications', 'لا توجد إشعارات غير مقروءة')
              : t('notifications.noNotifications', 'لا توجد إشعارات')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border ${
                !notification.read
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-lg font-semibold ${
                          !notification.read
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{getNotificationTypeLabel(notification.type)}</span>
                        <span>•</span>
                        <span>{formatTime(notification.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={t('notifications.markAsRead', 'تحديد كمقروء')}
                        >
                          <CheckCheck size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t('notifications.delete', 'حذف')}
                      >
                        <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFullDate(notification.created_at)}
                    </div>
                    {notification.link && (
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t('notifications.viewDetails', 'عرض التفاصيل')}
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

