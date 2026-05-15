/**
 * Product Utilities
 * Helper functions for product data transformation
 */

import { fixSupabaseUrl } from './urlFixer.js'
import { getSignedUrl } from './supabaseUrl.js'

/**
 * Transform product data to ensure image URLs are complete
 * If URL is public URL but doesn't work, convert to signed URL
 * @param {Object} product - Product object from database
 * @returns {Promise<Object>} Transformed product with complete image URLs
 */
export const transformProduct = async (product) => {
  if (!product) return product

  // Get image URL - prefer image field, fallback to first image in images array
  let imageUrl = product.image || null
  
  // If no image but has images array, use first image
  if (!imageUrl && product.images && product.images.length > 0) {
    imageUrl = product.images[0]
  }

  // Ensure URL is complete and properly formatted
  if (imageUrl) {
    // If it's a full URL (starts with http:// or https://), it's already complete (Supabase)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Check if it's a public URL that might not work
      // If it's a public URL and bucket is not public, convert to signed URL
      if (imageUrl.includes('/storage/v1/object/public/') && !imageUrl.includes('token=')) {
        try {
          // Extract file path from public URL
          const urlObj = new URL(imageUrl)
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
          if (pathMatch) {
            const filePath = pathMatch[1]
            // Try to get signed URL
            try {
              const signedUrl = await getSignedUrl(filePath, 31536000) // 1 year
              imageUrl = signedUrl
              console.log(`[Transform Product ${product.id}] Converted to signed URL`)
            } catch (signError) {
              console.warn(`[Transform Product ${product.id}] Could not create signed URL:`, signError.message)
              // Keep original URL
            }
          }
        } catch (urlError) {
          console.warn(`[Transform Product ${product.id}] Error processing URL:`, urlError)
        }
      } else {
        // Already signed URL or other format, use as is
        try {
          imageUrl = fixSupabaseUrl(imageUrl)
        } catch (urlError) {
          console.warn(`[Transform Product ${product.id}] Error fixing URL:`, urlError)
        }
      }
    } 
    // If it's a relative URL (starts with /), it's local storage
    else if (imageUrl.startsWith('/')) {
      // Local storage - keep as is, frontend will prepend base URL
    } 
    // Invalid URL format
    else {
      console.warn(`[Transform Product ${product.id}] Invalid image URL format:`, imageUrl)
      imageUrl = null
    }
  } else if (product.id) {
    console.warn(`[Transform Product ${product.id}] No image URL found for product: ${product.name}`)
  }

  const transformed = {
    ...product,
    image: imageUrl,
    imageUrl: imageUrl, // Add alias for frontend compatibility
    // Keep images array for backward compatibility
    images: product.images || (imageUrl ? [imageUrl] : []),
  }

  return transformed
}

/**
 * Transform array of products
 * @param {Array} products - Array of product objects
 * @returns {Promise<Array>} Transformed products
 */
export const transformProducts = async (products) => {
  if (!Array.isArray(products)) return products
  // Transform all products in parallel
  const transformed = await Promise.all(products.map(transformProduct))
  return transformed
}

