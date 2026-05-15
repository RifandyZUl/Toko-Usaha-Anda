/**
 * File Utilities
 * Helper functions for file operations
 */

import path from 'path'

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName)
  const name = path.basename(originalName, ext)
  const timestamp = Date.now()
  const random = Math.round(Math.random() * 1e9)
  
  // Sanitize filename more aggressively to avoid issues with Supabase
  // Remove all special characters, keep only alphanumeric and single dashes
  const sanitizedName = name
    .replace(/[^a-zA-Z0-9]/g, '-')  // Replace all non-alphanumeric with dash
    .replace(/-+/g, '-')            // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, '')        // Remove leading/trailing dashes
    .toLowerCase()
    .substring(0, 50)                // Limit length to avoid issues
  
  // Ensure we have a valid name
  const finalName = sanitizedName || 'image'
  
  return `${finalName}-${timestamp}-${random}${ext}`
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase()
}

/**
 * Validate image file
 * @param {Object} file - File object
 * @returns {Object} Validation result
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!file) {
    return { isValid: false, error: 'Tidak ada file yang diupload' }
  }
  
  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP',
    }
  }
  
  // Check file extension
  const ext = getFileExtension(file.originalname)
  if (!allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP',
    }
  }
  
  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Ukuran file terlalu besar. Maksimal 5MB',
    }
  }
  
  return { isValid: true, error: null }
}

