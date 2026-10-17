/**
 * Formatting Utilities
 * Reusable formatting functions for consistent data display
 */

import { logError } from './logger.js'

/**
 * Format currency to Indonesian Rupiah
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "Rp 25.000")
 */
export const formatCurrency = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return 'Rp 0'
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace('Rp', 'Rp ')
}

/**
 * Format numeric value for input field (e.g., 25000 -> "25.000")
 * @param {number|string} value - Value to format
 * @returns {string} Formatted number string
 */
export const formatCurrencyInput = (value) => {
  if (value === undefined || value === null || value === '') return ''
  const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]+/g, ''))
  if (isNaN(num)) return ''
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Parse currency string back to number
 * @param {string} value - Currency string
 * @returns {number} Parsed numeric value
 */
export const parseCurrency = (value) => {
  if (!value) return 0
  if (typeof value === 'number') return value
  return Number(value.replace(/[^0-9.-]+/g, ''))
}

/**
 * Get full URL for media (images)
 * Handles Supabase URLs, local paths, and fallback placeholders
 * @param {string} path - Image path or full URL
 * @returns {string} Safe absolute URL
 */
export const getMediaUrl = (path) => {
  const PLACEHOLDER = 'https://via.placeholder.com/400x400?text=No+Image'
  
  if (!path) return PLACEHOLDER
  
  const trimmedPath = String(path).trim()
  if (!trimmedPath) return PLACEHOLDER

  // 1. Data URLs or already absolute URLs
  if (/^(https?:\/\/|data:)/i.test(trimmedPath)) {
    return trimmedPath
  }

  // 2. Local relative paths (must prepend backend URL)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl
  
  const cleanPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Format date to standard Indonesian format
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '-'
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return '-'
    
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
    }
    
    return new Intl.DateTimeFormat('id-ID', options).format(dateObj)
  } catch (error) {
    logError('Date format error', error)
    return '-'
  }
}

/**
 * Format date and time
 */
export const formatDateTime = (date) => formatDate(date, true)

/**
 * Truncate long text with ellipsis
 */
export const truncate = (text, length = 50) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

/**
 * Format Order ID for display
 */
export const formatOrderId = (id) => {
  if (!id) return '-'
  return `#${String(id).substring(0, 8).toUpperCase()}`
}
