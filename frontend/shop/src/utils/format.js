/**
 * Formatting Utilities
 * Reusable formatting functions for consistent data display
 */

import { logError } from './logger'

/**
 * Format currency to Indonesian Rupiah
 * Format: Rp 20.000 (with dot as thousand separator)
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rp 0'
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return 'Rp 0'
  }
  
  // Format with dot as thousand separator (Indonesian format)
  // Remove decimal part if it's .00
  const formatted = numAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `Rp ${formatted}`
}

/**
 * Format date to Indonesian locale
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '-'
  
  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('id-ID', defaultOptions)
  } catch (error) {
    logError('Error formatting date', error)
    return '-'
  }
}

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format order ID for display
 * @param {string} orderId - Order ID
 * @returns {string} Formatted order ID
 */
export const formatOrderId = (orderId) => {
  if (!orderId) return '-'
  return `#${orderId.slice(0, 8).toUpperCase()}`
}

