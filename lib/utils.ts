/**
 * Utility functions for RTL support and formatting
 */

/**
 * Check if the current locale is RTL (Arabic, Hebrew, etc.)
 */
export function isRTL(locale?: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur']
  const currentLocale = locale || 'en'
  return rtlLocales.includes(currentLocale)
}

/**
 * Get direction class for Tailwind based on locale
 */
export function getDirectionClass(locale?: string): string {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'ILS'): string {
  if (currency === 'ILS') {
    // Format for Israeli Shekel with ₪ symbol
    const formatted = new Intl.NumberFormat('he-IL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
    return `₪ ${formatted}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format date
 */
export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale).format(dateObj)
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(prefix: string = 'INV', sequence: number): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  return `${prefix}-${year}${month}-${seq}`
}

