/**
 * Supabase URL Utilities
 * Helper functions for generating Supabase Storage URLs
 */

import { supabase, STORAGE_BUCKET } from '../config/supabase.js'

/**
 * Get signed URL for a file path
 * Works for both public and private buckets
 * @param {string} filePath - File path in storage (e.g., "products/image.jpg")
 * @param {number} expiresIn - Expiry time in seconds (default: 1 year)
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrl = async (filePath, expiresIn = 31536000) => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

  const {
    data: { signedUrl },
    error,
  } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(cleanPath, expiresIn)

  if (error) {
    throw error
  }

  if (!signedUrl) {
    throw new Error('Failed to create signed URL')
  }

  return signedUrl
}

/**
 * Get public URL for a file path
 * Only works if bucket is public
 * @param {string} filePath - File path in storage
 * @returns {string} Public URL
 */
export const getPublicUrl = (filePath) => {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(cleanPath)

  return publicUrl
}

