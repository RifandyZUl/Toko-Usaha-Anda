/**
 * Image Utility Functions
 * Handles image loading, error handling, and URL fixing
 */

import { logError } from './logger'

/**
 * Fix Supabase image URL encoding issues
 * @param {string} originalSrc - Original image URL
 * @returns {string|null} Fixed URL or null if can't be fixed
 */
export const fixSupabaseImageUrl = (originalSrc) => {
  if (!originalSrc || !originalSrc.startsWith('https://') || !originalSrc.includes('supabase.co')) {
    return null
  }

  try {
    const url = new URL(originalSrc)
    const pathParts = url.pathname.split('/')

    // Find the 'public' part (after this is bucket + file path)
    const publicIndex = pathParts.indexOf('public')
    if (publicIndex !== -1 && publicIndex < pathParts.length - 1) {
      // Get bucket and file path parts
      const afterPublic = pathParts.slice(publicIndex + 1)
      const bucket = afterPublic[0]
      const filePathParts = afterPublic.slice(1)

      // Encode each file path segment
      const encodedFilePath = filePathParts
        .map(part => {
          // Try to decode first to avoid double encoding
          try {
            const decoded = decodeURIComponent(part)
            return encodeURIComponent(decoded)
          } catch {
            // If already encoded or invalid, encode as-is
            return encodeURIComponent(part)
          }
        })
        .join('/')

      // Reconstruct URL
      const newPath = `/storage/v1/object/public/${bucket}/${encodedFilePath}`
      return `${url.origin}${newPath}${url.search}${url.hash}`
    }
  } catch (error) {
    logError('Error fixing Supabase URL', error)
  }

  return null
}

/**
 * Format any image URL with backend host and fallback
 * @param {string|Object} input - String URL or product/variant object
 * @returns {string} Formatted full image URL
 */
export const formatImageUrl = (input) => {
  if (!input) return '/placeholder.jpg'

  let url = ''
  if (typeof input === 'string') {
    url = input.trim()
  } else if (typeof input === 'object') {
    url = input.imageUrl || input.image || input.url || ''
  }

  if (!url || typeof url !== 'string') return '/placeholder.jpg'

  // Prepend backend host if URL is a local relative upload path
  if (url.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const backendHost = apiBase.replace(/\/api\/?$/, '')
    return `${backendHost}${url}`
  }

  return url
}

/**
 * Get product image URL with fallback (alias to formatImageUrl)
 * @param {Object|string} product - Product object or direct URL string
 * @returns {string} Image URL
 */
export const getProductImageUrl = (product) => {
  return formatImageUrl(product)
}

/**
 * Handle image error with automatic retry and fallback
 * @param {Event} event - Image error event
 * @param {Object} product - Product object (optional)
 * @param {string} fallbackUrl - Fallback image URL
 */
export const handleImageError = (event, product = null, fallbackUrl = '/placeholder.jpg') => {
  const img = event.target
  const attemptedSrc = img.src

  // Don't retry if already using placeholder
  if (attemptedSrc.includes('placeholder')) {
    return
  }

  // Try to fix Supabase URL if applicable
  if (product) {
    const originalSrc = product.imageUrl || product.image
    const fixedUrl = fixSupabaseImageUrl(originalSrc)
    
    if (fixedUrl && fixedUrl !== attemptedSrc) {
      img.src = fixedUrl
      return
    }
  }

  // Fallback to placeholder
  img.src = fallbackUrl
}

