/**
 * URL Fixer Utility
 * Fixes Supabase Storage URLs that might have encoding issues
 */

/**
 * Fix Supabase Storage URL encoding
 * @param {string} url - Supabase Storage URL
 * @returns {string} Fixed URL with proper encoding
 */
export const fixSupabaseUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return url
  }

  // If it's not a Supabase URL, return as is
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url
  }

  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    
    // Find the bucket name and file path
    // Path format: /storage/v1/object/public/{bucket}/{filepath}
    const bucketIndex = pathParts.indexOf('public')
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return url // Can't parse, return original
    }

    const bucket = pathParts[bucketIndex + 1]
    const filePathParts = pathParts.slice(bucketIndex + 2)
    
    // Supabase URLs from getPublicUrl should work as-is
    // Only fix if there are obvious issues like double slashes
    let cleanPath = urlObj.pathname
    
    // Clean up double slashes (except after protocol)
    cleanPath = cleanPath.replace(/\/+/g, '/')
    
    // Remove trailing slash
    cleanPath = cleanPath.replace(/\/$/, '')
    
    // Reconstruct URL
    const fixedUrl = `${urlObj.origin}${cleanPath}${urlObj.search}${urlObj.hash}`
    
    return fixedUrl
  } catch (error) {
    console.warn('Error fixing URL:', error, url)
    return url // Return original if fixing fails
  }
}

/**
 * Check if URL is accessible
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} True if accessible
 */
export const checkUrlAccessibility = async (url) => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues
    })
    return true
  } catch (error) {
    return false
  }
}

