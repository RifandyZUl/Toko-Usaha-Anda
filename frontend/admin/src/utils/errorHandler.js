/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly error messages
 */

import { logError } from './logger.js'

/**
 * Get user-friendly error message from error object
 * @param {Error|Object|string} error - Error object or message
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui'

  // If it's already a string, return it
  if (typeof error === 'string') return error

  // If it's an Error object
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
    }

    // Check for timeout errors
    if (error.message.includes('timeout')) {
      return 'Request timeout. Silakan coba lagi.'
    }

    return error.message || 'Terjadi kesalahan yang tidak diketahui'
  }

  // If it's an object with error property
  if (error.error) {
    return error.error
  }

  // If it's an object with message property
  if (error.message) {
    return error.message
  }

  return 'Terjadi kesalahan yang tidak diketahui'
}

/**
 * Handle API error and return user-friendly message
 * @param {Error} error - Error from API call
 * @param {string} defaultMessage - Default error message
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error, defaultMessage = 'Terjadi kesalahan saat memproses request') => {
  logError('API Error', error)

  const message = getErrorMessage(error)

  // Map common HTTP status codes to user-friendly messages
  if (error.status === 401) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.'
  }

  if (error.status === 403) {
    return 'Anda tidak memiliki izin untuk melakukan aksi ini.'
  }

  if (error.status === 404) {
    return 'Data yang diminta tidak ditemukan.'
  }

  if (error.status === 422) {
    return message || 'Data yang dimasukkan tidak valid.'
  }

  if (error.status === 500) {
    return 'Terjadi kesalahan di server. Silakan coba lagi nanti.'
  }

  return message || defaultMessage
}

