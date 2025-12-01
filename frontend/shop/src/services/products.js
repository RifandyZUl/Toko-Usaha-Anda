import { apiClient } from '../config/api.js'

/**
 * Products API Service
 */

/**
 * Get all products
 * @param {Object} params - Query parameters
 * @param {string} params.category - Filter by category slug
 * @param {string} params.search - Search term
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const getProducts = async (params = {}) => {
  try {
    const response = await apiClient.get('/products', params)
    return {
      success: true,
      products: response.products || [],
      pagination: response.pagination || {},
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      success: false,
      error: error.message,
      products: [],
      pagination: {},
    }
  }
}

/**
 * Get product by ID
 * @param {string|number} productId - Product ID
 */
export const getProductById = async productId => {
  try {
    const product = await apiClient.get(`/products/${productId}`)
    return {
      success: true,
      product,
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return {
      success: false,
      error: error.message,
      product: null,
    }
  }
}

/**
 * Get all categories
 */
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/products/categories')
    return {
      success: true,
      categories: response.categories || [],
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return {
      success: false,
      error: error.message,
      categories: [],
    }
  }
}

