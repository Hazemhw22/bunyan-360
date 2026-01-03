/**
 * Calculation utilities for progress-based billing
 * Formula: Earned Value = (unitPrice * quantity) * (newProgress - oldProgress) / 100
 */

export interface ServiceCalculation {
  unitPrice: number
  quantity: number
  oldProgress: number
  newProgress: number
}

/**
 * Calculate the earned value for a service based on progress change
 */
export function calculateEarnedValue({
  unitPrice,
  quantity,
  oldProgress,
  newProgress,
}: ServiceCalculation): number {
  const progressDelta = Math.max(0, newProgress - oldProgress)
  return (unitPrice * quantity) * (progressDelta / 100)
}

/**
 * Calculate total earned value for multiple services
 */
export function calculateTotalEarnedValue(services: ServiceCalculation[]): number {
  return services.reduce((total, service) => {
    return total + calculateEarnedValue(service)
  }, 0)
}

/**
 * Calculate current payable amount for a service
 */
export function calculateCurrentPayableAmount(
  unitPrice: number,
  quantity: number,
  currentProgress: number
): number {
  return (unitPrice * quantity) * (currentProgress / 100)
}

/**
 * Calculate unbilled amount (current progress - last invoiced progress)
 */
export function calculateUnbilledAmount(
  unitPrice: number,
  quantity: number,
  currentProgress: number,
  lastInvoicedProgress: number
): number {
  const unbilledProgress = Math.max(0, currentProgress - lastInvoicedProgress)
  return (unitPrice * quantity) * (unbilledProgress / 100)
}
