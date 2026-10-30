/**
 * Upload Routes
 * Handles file upload endpoints with Supabase Storage
 */

import express from 'express'
import { uploadSingle } from '../middleware/upload.js'
import { authenticate, adminOnly } from '../middleware/auth.js'
import { supabase, STORAGE_BUCKET, isSupabaseConfigured } from '../config/supabase.js'
import { 
  generateUniqueFilename, 
  validateImageFile, 
  validateImageBuffer 
} from '../utils/fileUtils.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

/**
 * Test Supabase connection endpoint
 * GET /api/upload/test
 * Admin only
 * Tests Supabase Storage connection and bucket access
 */
router.get('/test', authenticate, adminOnly, async (req, res) => {
  try {
    const { isSupabaseConfigured, supabase, STORAGE_BUCKET } = await import('../config/supabase.js')
    
    if (!isSupabaseConfigured()) {
      return res.json({
        success: false,
        configured: false,
        message: 'Supabase tidak dikonfigurasi. Menggunakan local storage.',
        storage: 'local',
      })
    }

    // Test bucket access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return res.status(500).json({
        success: false,
        configured: true,
        error: listError.message,
        message: 'Gagal mengakses Supabase Storage',
      })
    }

    // Check if bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET)
    
    if (!bucketExists) {
      return res.status(404).json({
        success: false,
        configured: true,
        error: `Bucket "${STORAGE_BUCKET}" tidak ditemukan`,
        message: `Pastikan bucket "${STORAGE_BUCKET}" sudah dibuat di Supabase Dashboard`,
        availableBuckets: buckets?.map(b => b.name) || [],
      })
    }

    res.json({
      success: true,
      configured: true,
      storage: 'supabase',
      bucket: STORAGE_BUCKET,
      bucketExists: true,
      message: 'Supabase Storage siap digunakan',
    })
  } catch (error) {
    console.error('Supabase test error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal test koneksi Supabase',
    })
  }
})

/**
 * Upload image endpoint
 * POST /api/upload/image
 * Admin only
 * Uploads to Supabase Storage if configured, otherwise falls back to local storage
 */
router.post('/image', authenticate, adminOnly, async (req, res) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'Gagal mengupload gambar',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Tidak ada file yang diupload',
      })
    }


    try {
      // 1. Basic validation (extension, size, declared type)
      const basicValidation = validateImageFile(req.file)
      if (!basicValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: basicValidation.error,
        })
      }

      // 2. Deep validation (Magic Byte check) - prevent disguised files
      const deepValidation = await validateImageBuffer(req.file.buffer, req.file.mimetype)
      if (!deepValidation.isValid) {
        return res.status(403).json({
          success: false,
          error: deepValidation.error,
          securityAlert: true
        })
      }

      // Generate unique filename
      const filename = generateUniqueFilename(req.file.originalname)
      const filePath = `products/${filename}`

      let fileUrl

      // Upload to Supabase if configured
      // Upload to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath

          // Ensure bucket exists or auto-create as public bucket
          try {
            const { data: buckets } = await supabase.storage.listBuckets()
            if (!buckets?.some((b) => b.name === STORAGE_BUCKET)) {
              await supabase.storage.createBucket(STORAGE_BUCKET, { public: true })
            }
          } catch (bucketCheckErr) {
            console.warn('Supabase bucket check notice:', bucketCheckErr.message)
          }

          // Upload file to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(cleanPath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: true,
            })

          if (uploadError) throw uploadError

          // Get permanent public URL for public bucket
          const { data: publicData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(cleanPath)

          fileUrl = publicData?.publicUrl

          if (!fileUrl) {
            const { data: signData } = await supabase.storage
              .from(STORAGE_BUCKET)
              .createSignedUrl(cleanPath, 31536000)
            fileUrl = signData?.signedUrl
          }
        } catch (supabaseError) {
          console.warn('Supabase upload failed, falling back to local storage:', supabaseError.message)
          fileUrl = await uploadToLocal(req.file, filename)
        }
      } else {
        // Fallback to local storage
        fileUrl = await uploadToLocal(req.file, filename)
      }

      res.json({
        success: true,
        url: fileUrl,
        filename,
        message: 'Gambar berhasil diupload',
      })
    } catch (error) {
      console.error('Upload error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Gagal mengupload gambar',
      })
    }
  })
})

/**
 * Fallback: Upload to local storage
 * @param {Object} file - Multer file object
 * @param {string} filename - Generated filename
 * @returns {Promise<string>} File URL
 */
async function uploadToLocal(file, filename) {
  const uploadsDir = path.join(__dirname, '../../public/uploads')
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const filePath = path.join(uploadsDir, filename)
  
  // Write file to disk
  await fs.promises.writeFile(filePath, file.buffer)
  
  return `/uploads/${filename}`
}

export default router

