/**
 * File Upload Middleware
 * Handles image uploads using multer (memory storage for Supabase)
 */

import multer from 'multer'
import { validateImageFile } from '../utils/fileUtils.js'

// Use memory storage for Supabase upload
// File will be stored in memory and then uploaded to Supabase
const storage = multer.memoryStorage()

// File filter - only images
const fileFilter = (req, file, cb) => {
  const validation = validateImageFile(file)
  if (validation.isValid) {
    cb(null, true)
  } else {
    cb(new Error(validation.error))
  }
}

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter,
})

// Single file upload middleware
export const uploadSingle = upload.single('image')

