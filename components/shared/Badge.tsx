'use client'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'secondary'
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
    warning: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300',
    danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  }

  return (
    <span
      className={`px-2.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

