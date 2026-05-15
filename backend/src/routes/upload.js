/**
 * Upload Routes
 * Handles file upload endpoints with Supabase Storage
 */

import express from 'express'
import { uploadSingle } from '../middleware/upload.js'
import { authenticate, adminOnly } from '../middleware/auth.js'
import { supabase, STORAGE_BUCKET, isSupabaseConfigured, getSupabaseUrl } from '../config/supabase.js'
import { generateUniqueFilename, validateImageFile } from '../utils/fileUtils.js'
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
      // Validate file
      const validation = validateImageFile(req.file)
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        })
      }

      // Generate unique filename
      const filename = generateUniqueFilename(req.file.originalname)
      const filePath = `products/${filename}`

      let fileUrl

      // Upload to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          // Upload file to Supabase Storage
          const { data, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: false,
            })

          if (uploadError) {
            console.error('Supabase upload error:', uploadError)
            throw uploadError
          }

          // Get signed URL instead of public URL
          // Signed URL works even if bucket is not public
          // Note: path should not have leading slash
          const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
          
          console.log(`📤 Creating signed URL for path: ${cleanPath}`)
          
          // Create signed URL (valid for 1 year = 31536000 seconds)
          // This works for both public and private buckets
          const {
            data: { signedUrl },
            error: signError,
          } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(cleanPath, 31536000) // 1 year expiry

          if (signError) {
            console.error('❌ Error creating signed URL:', signError)
            throw signError
          }

          if (!signedUrl) {
            console.error('❌ Signed URL is null')
            throw new Error('Failed to create signed URL')
          }

          fileUrl = signedUrl

          console.log(`✅ Image uploaded to Supabase`)
          console.log(`   File path: ${filePath}`)
          console.log(`   Clean path: ${cleanPath}`)
          console.log(`   Signed URL: ${fileUrl.substring(0, 100)}...`)
          console.log(`   URL expires in: 1 year`)
        } catch (supabaseError) {
          console.error('Supabase upload failed, falling back to local:', supabaseError)
          // Fallback to local storage
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

