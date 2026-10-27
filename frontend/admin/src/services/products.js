/**
 * Products API Service
 * Handles all product-related API calls for admin
 */

import { apiClient, ApiError } from '../config/api.js'
import { handleApiError } from '../utils/errorHandler.js'
import { logError, logDebug } from '../utils/logger.js'

/**
 * Get all products with optional filters
 * Admin can see both active and inactive products
 * @param {Object} params - Query parameters
 * @param {string} params.category - Filter by category slug
 * @param {string} params.search - Search term
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} Products data with pagination
 */
export const getProducts = async (params = {}) => {
  try {
    const response = await apiClient.get('/products', params)
    return {
      success: true,
      products: response.products || [],
      pagination: response.pagination || {},
      error: null,
    }
  } catch (error) {
    logError('Error fetching products', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal mengambil data produk'),
      products: [],
      pagination: {},
    }
  }
}

/**
 * Get product by ID
 * @param {string|number} id - Product ID
 * @returns {Promise<Object>} Product data
 */
export const getProductById = async (id) => {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID produk tidak valid',
        product: null,
      }
    }

    const response = await apiClient.get(`/products/${id}`)
    return {
      success: true,
      product: response.product || response,
      error: null,
    }
  } catch (error) {
    logError('Error fetching product', error)

    if (error instanceof ApiError && error.status === 404) {
      return {
        success: false,
        error: 'Produk tidak ditemukan',
        product: null,
      }
    }

    return {
      success: false,
      error: handleApiError(error, 'Gagal mengambil data produk'),
      product: null,
    }
  }
}

/**
 * Get all product categories
 * @returns {Promise<Object>} Categories data
 */
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/products/categories')
    return {
      success: true,
      categories: response.categories || [],
      error: null,
    }
  } catch (error) {
    logError('Error fetching categories', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal mengambil data kategori'),
      categories: [],
    }
  }
}

/**
 * Create new product (Admin only)
 * @param {Object} productData - Product data
 * @param {string} productData.name - Product name
 * @param {string} productData.slug - Product slug
 * @param {string} productData.description - Product description
 * @param {number} productData.price - Product price
 * @param {number} productData.stock - Product stock
 * @param {string} productData.categoryId - Category ID
 * @param {string} productData.image - Product image URL
 * @param {boolean} productData.isActive - Product active status
 * @returns {Promise<Object>} Created product data
 */
export const createProduct = async (productData) => {
  try {
    logDebug('Creating product - sending data', productData)
    const response = await apiClient.post('/products', productData)
    logDebug('Create product response', response)
    return {
      success: true,
      product: response.product || response,
      message: response.message || 'Produk berhasil dibuat',
      error: null,
      errors: null,
    }
  } catch (error) {
    logError('Error creating product', error)
    logDebug('Error details', { data: error.data, status: error.status })
    
    // Handle validation errors from backend
    if (error instanceof ApiError && error.data?.errors) {
      const fieldErrors = {}
      const messageList = []
      if (Array.isArray(error.data.errors)) {
        error.data.errors.forEach(e => {
          if (e.field) fieldErrors[e.field] = e.message
          if (e.message) messageList.push(e.message)
        })
      } else if (typeof error.data.errors === 'object') {
        Object.entries(error.data.errors).forEach(([field, msg]) => {
          fieldErrors[field] = msg
          messageList.push(msg)
        })
      }
      return {
        success: false,
        error: messageList.join(', ') || error.data?.error || 'Validasi gagal',
        errors: fieldErrors,
        product: null,
        message: null,
      }
    }
    
    // Handle error with error property
    if (error instanceof ApiError && error.data?.error) {
      return {
        success: false,
        error: error.data.error || error.message || 'Gagal membuat produk',
        errors: null,
        product: null,
        message: null,
      }
    }
    
    return {
      success: false,
      error: handleApiError(error, 'Gagal membuat produk'),
      errors: null,
      product: null,
      message: null,
    }
  }
}

/**
 * Update existing product (Admin only)
 * @param {string|number} id - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Promise<Object>} Updated product data
 */
export const updateProduct = async (id, productData) => {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID produk tidak valid',
        product: null,
        message: null,
        errors: null,
      }
    }

    logDebug('Updating product', { id, data: productData })
    const response = await apiClient.put(`/products/${id}`, productData)
    logDebug('Update product response', response)
    return {
      success: true,
      product: response.product || response,
      message: response.message || 'Produk berhasil diperbarui',
      error: null,
      errors: null,
    }
  } catch (error) {
    logError('Error updating product', error)
    logDebug('Error details', { data: error.data, status: error.status })

    if (error instanceof ApiError && error.status === 404) {
      return {
        success: false,
        error: 'Produk tidak ditemukan',
        product: null,
        message: null,
        errors: null,
      }
    }

    // Handle validation errors from backend
    if (error instanceof ApiError && error.data?.errors) {
      const fieldErrors = {}
      const messageList = []
      if (Array.isArray(error.data.errors)) {
        error.data.errors.forEach(e => {
          if (e.field) fieldErrors[e.field] = e.message
          if (e.message) messageList.push(e.message)
        })
      } else if (typeof error.data.errors === 'object') {
        Object.entries(error.data.errors).forEach(([field, msg]) => {
          fieldErrors[field] = msg
          messageList.push(msg)
        })
      }
      return {
        success: false,
        error: messageList.join(', ') || error.data?.error || 'Validasi gagal',
        errors: fieldErrors,
        product: null,
        message: null,
      }
    }

    // Handle error with error property
    if (error instanceof ApiError && error.data?.error) {
      return {
        success: false,
        error: error.data.error || error.message || 'Gagal memperbarui produk',
        errors: null,
        product: null,
        message: null,
      }
    }

    return {
      success: false,
      error: handleApiError(error, 'Gagal memperbarui produk'),
      product: null,
      message: null,
      errors: null,
    }
  }
}

/**
 * Delete product (Admin only)
 * @param {string|number} id - Product ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteProduct = async (id) => {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID produk tidak valid',
        message: null,
      }
    }

    logDebug('Deleting product', { id })
    const response = await apiClient.delete(`/products/${id}`)
    logDebug('Delete product response', response)
    return {
      success: true,
      message: response.message || 'Produk berhasil dihapus',
      error: null,
    }
  } catch (error) {
    logError('Error deleting product', error)
    logDebug('Error details', { data: error.data, status: error.status })

    if (error instanceof ApiError && error.status === 404) {
      return {
        success: false,
        error: 'Produk tidak ditemukan',
        message: null,
      }
    }

    // Handle error with error property
    if (error instanceof ApiError && error.data?.error) {
      return {
        success: false,
        error: error.data.error || error.message || 'Gagal menghapus produk',
        message: null,
      }
    }

    return {
      success: false,
      error: handleApiError(error, 'Gagal menghapus produk'),
      message: null,
    }
  }
}

