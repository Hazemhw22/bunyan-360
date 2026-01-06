'use client'

import { X, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
        }
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800',
        }
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800',
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`${styles.iconBg} p-2 rounded-full`}>
              <AlertTriangle className={`${styles.iconColor} w-5 h-5`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="min-w-[100px]"
          >
            {cancelText || t('common.cancel', 'إلغاء')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`${styles.buttonBg} text-white min-w-[100px]`}
          >
            {loading ? t('common.loading', 'جاري...') : confirmText || t('common.confirm', 'تأكيد')}
          </Button>
        </div>
      </div>
    </div>
  )
}

