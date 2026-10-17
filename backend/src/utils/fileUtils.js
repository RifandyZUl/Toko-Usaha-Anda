/**
 * File Utilities
 * Helper functions for file operations
 */

import path from 'path'
import { fileTypeFromBuffer } from 'file-type'

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
  
  // Sanitize filename more aggressively
  const sanitizedName = name
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .substring(0, 50)
  
  const finalName = sanitizedName || 'image'
  return `${finalName}-${timestamp}-${random}${ext}`
}

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase()
}

/**
 * Deep Image Validation (Magic Bytes)
 * Verifies that the file content matches its declared type.
 * @param {Buffer} buffer - File buffer
 * @param {string} declaredMime - Mime type declared by browser
 * @returns {Promise<{isValid: boolean, error: string | null}>}
 */
export const validateImageBuffer = async (buffer, declaredMime) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  
  if (!buffer) return { isValid: false, error: 'No file buffer provided' }

  // Detect real file type from magic bytes
  const type = await fileTypeFromBuffer(buffer)
  
  if (!type || !allowedMimes.includes(type.mime)) {
    return {
      isValid: false,
      error: 'Security Alert: File content does not match allowed image types!',
    }
  }

  // Cross-check with declared mime (basic defense)
  if (declaredMime && declaredMime !== type.mime) {
    // Specifically allow jpg/jpeg mismatch as it's common
    const isJpegMismatch = 
      (declaredMime === 'image/jpeg' && type.mime === 'image/jpg') ||
      (declaredMime === 'image/jpg' && type.mime === 'image/jpeg')
    
    if (!isJpegMismatch) {
      return {
        isValid: false,
        error: 'Security Alert: Mime-type mismatch detected!',
      }
    }
  }

  return { isValid: true, error: null }
}

/**
 * Basic image validation (for Multer filter)
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!file) return { isValid: false, error: 'File is required' }
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file format' }
  }
  
  const ext = getFileExtension(file.originalname)
  if (!allowedExtensions.includes(ext)) {
    return { isValid: false, error: 'Invalid file extension' }
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large (max 5MB)' }
  }
  
  return { isValid: true, error: null }
}
