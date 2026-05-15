/**
 * Custom Hook for Data Fetching
 * Handles loading, error states, and data fetching logic
 */

import { useState, useCallback, useEffect } from 'react'
import { logError } from '../utils/logger'

/**
 * Custom hook for data fetching with loading and error states
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {Object} options - Options for the hook
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: false)
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @returns {Object} { data, loading, error, fetchData, setData, setError, reset }
 */
export const useDataFetching = (fetchFunction, options = {}) => {
  const { autoFetch = false, onSuccess, onError } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState(null)

  /**
   * Fetch data using the provided function
   * @param {*} params - Parameters to pass to fetch function
   */
  const fetchData = useCallback(
    async (params = {}) => {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchFunction(params)

        if (result.success) {
          // Handle different response formats
          const data = result.data || result.products || result.orders || result.categories || result
          setData(data)
          onSuccess?.(result)
        } else {
          const errorMessage = result.error || 'Gagal mengambil data'
          setError(errorMessage)
          onError?.(errorMessage)
        }
      } catch (err) {
        logError('Data fetching error', err)
        const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data'
        setError(errorMessage)
        onError?.(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [fetchFunction, onSuccess, onError]
  )

  // Auto-fetch on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch && fetchFunction) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, fetchFunction])

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    fetchData,
    setData,
    setError,
    reset,
  }
}

