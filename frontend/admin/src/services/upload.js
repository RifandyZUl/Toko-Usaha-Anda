/**
 * Upload Service
 * Handles file upload operations
 */

import { apiClient, ApiError } from '../config/api.js'
import { handleApiError } from '../utils/errorHandler.js'
import { logError } from '../utils/logger.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Upload image file
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Upload result with file URL
 */
export const uploadImage = async (file) => {
  try {
    if (!file) {
      return {
        success: false,
        error: 'Tidak ada file yang dipilih',
        url: null,
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP',
        url: null,
      }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Ukuran file terlalu besar. Maksimal 5MB',
        url: null,
      }
    }

    // Create FormData
    const formData = new FormData()
    formData.append('image', file)

    // Get token for authorization
    const token = apiClient.getToken()
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    // Upload file
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Gagal mengupload gambar',
      }))
      throw new ApiError(error.error || 'Gagal mengupload gambar', response.status)
    }

    const data = await response.json()

    // Handle both Supabase URL (full URL) and local URL (relative path)
    let imageUrl = data.url
    
    // If it's a relative URL (local storage), prepend base URL
    if (imageUrl && imageUrl.startsWith('/')) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
      imageUrl = `${baseUrl}${imageUrl}`
    }

    return {
      success: true,
      url: imageUrl,
      filename: data.filename,
      message: data.message || 'Gambar berhasil diupload',
      error: null,
    }
  } catch (error) {
    logError('Upload error', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal mengupload gambar'),
      url: null,
    }
  }
}

