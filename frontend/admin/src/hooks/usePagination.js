/**
 * Custom Hook for Pagination
 * Handles pagination state and calculations
 */

import { useState, useCallback, useMemo, useEffect } from 'react'

/**
 * Custom hook for pagination
 * @param {number} itemsPerPage - Number of items per page (default: 10)
 * @param {number} totalItems - Total number of items (can be updated dynamically)
 * @returns {Object} Pagination state and functions
 */
export const usePagination = (itemsPerPage = 10, totalItems = 0) => {
  const [currentPage, setCurrentPageState] = useState(1)

  // Calculate pagination values
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / itemsPerPage) || 1
  }, [totalItems, itemsPerPage])

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPageState(1)
    }
  }, [totalPages, currentPage])

  const startIndex = useMemo(() => {
    return (currentPage - 1) * itemsPerPage
  }, [currentPage, itemsPerPage])

  const endIndex = useMemo(() => {
    return startIndex + itemsPerPage
  }, [startIndex, itemsPerPage])

  /**
   * Go to specific page
   * @param {number} page - Page number
   */
  const goToPage = useCallback(
    page => {
      const pageNumber = Math.max(1, Math.min(page, totalPages))
      setCurrentPageState(pageNumber)
    },
    [totalPages]
  )

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    setCurrentPageState(prev => Math.min(prev + 1, totalPages))
  }, [totalPages])

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    setCurrentPageState(prev => Math.max(prev - 1, 1))
  }, [])

  /**
   * Reset to first page
   */
  const resetPage = useCallback(() => {
    setCurrentPageState(1)
  }, [])

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    setCurrentPage: setCurrentPageState,
  }
}

