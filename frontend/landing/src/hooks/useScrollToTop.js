import { useCallback } from 'react'

/**
 * Custom hook untuk scroll to top functionality
 * @returns {Object} Object dengan fungsi scrollToTop
 */
export function useScrollToTop() {
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }, [])

  return { scrollToTop }
}

