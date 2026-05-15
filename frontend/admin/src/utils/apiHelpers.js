/**
 * API Helper Utilities
 * Common patterns for API calls and error handling
 */

import { logError } from './logger'

/**
 * Standard API response handler
 * @param {Object} result - API result object
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @returns {boolean} True if successful
 */
export const handleApiResponse = (result, onSuccess, onError) => {
  if (result.success) {
    onSuccess?.(result)
    return true
  } else {
    const errorMessage = result.error || 'Terjadi kesalahan'
    logError('API operation failed', errorMessage)
    onError?.(errorMessage)
    return false
  }
}

/**
 * Execute API call with standard error handling
 * @param {Function} apiCall - Async API function
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @returns {Promise<boolean>} True if successful
 */
export const executeApiCall = async (apiCall, onSuccess, onError) => {
  try {
    const result = await apiCall()
    return handleApiResponse(result, onSuccess, onError)
  } catch (error) {
    logError('API call error', error)
    const errorMessage = error.message || 'Terjadi kesalahan saat memproses request'
    onError?.(errorMessage)
    return false
  }
}

/**
 * Create standardized error handler
 * @param {Function} setError - Function to set error state
 * @param {Function} showToast - Function to show toast notification
 * @returns {Function} Error handler function
 */
export const createErrorHandler = (setError, showToast) => {
  return errorMessage => {
    setError(errorMessage)
    showToast?.(errorMessage)
  }
}

