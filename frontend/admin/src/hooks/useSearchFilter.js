/**
 * Custom Hook for Search and Filter
 * Handles search term and filter state management
 */

import { useState, useCallback, useMemo } from 'react'

/**
 * Custom hook for search and filter functionality
 * @param {Object} options - Options for the hook
 * @param {Function} options.onFilterChange - Callback when filter changes
 * @returns {Object} Search and filter state and functions
 */
export const useSearchFilter = (options = {}) => {
  const { onFilterChange } = options

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})

  /**
   * Update search term
   * @param {string} term - Search term
   */
  const setSearch = useCallback(
    term => {
      setSearchTerm(term)
      onFilterChange?.({ searchTerm: term, filters })
    },
    [filters, onFilterChange]
  )

  /**
   * Update filter value
   * @param {string} key - Filter key
   * @param {*} value - Filter value
   */
  const setFilter = useCallback(
    (key, value) => {
      setFilters(prev => {
        const newFilters = { ...prev, [key]: value }
        onFilterChange?.({ searchTerm, filters: newFilters })
        return newFilters
      })
    },
    [searchTerm, onFilterChange]
  )

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchTerm('')
    onFilterChange?.({ searchTerm: '', filters: {} })
  }, [onFilterChange])

  /**
   * Clear specific filter
   * @param {string} key - Filter key to clear
   */
  const clearFilter = useCallback(
    key => {
      setFilters(prev => {
        const newFilters = { ...prev }
        delete newFilters[key]
        onFilterChange?.({ searchTerm, filters: newFilters })
        return newFilters
      })
    },
    [searchTerm, onFilterChange]
  )

  /**
   * Check if any filter is active
   */
  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' || Object.keys(filters).length > 0
  }, [searchTerm, filters])

  return {
    searchTerm,
    filters,
    setSearch,
    setFilter,
    clearFilters,
    clearFilter,
    hasActiveFilters,
  }
}

