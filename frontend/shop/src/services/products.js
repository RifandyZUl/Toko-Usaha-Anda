import { apiClient } from '../config/api.js'
import { logError, logDebug } from '../utils/logger.js'

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
    logError('Error fetching products', error)
    return {
      success: false,
      error: error.message,
      products: [],
      pagination: {},
    }
  }
}

/**
 * Get featured products (most popular & best selling)
 * @param {number} limit - Max number of featured products to fetch
 */
export const getFeaturedProducts = async (limit = 10) => {
  try {
    const response = await apiClient.get('/products/featured', { limit })
    return {
      success: true,
      products: response.products || [],
    }
  } catch (error) {
    logError('Error fetching featured products', error)
    return {
      success: false,
      error: error.message,
      products: [],
    }
  }
}

/**
 * Get product by ID
 * @param {string|number} productId - Product ID
 */
export const getProductById = async productId => {
  try {
    const response = await apiClient.get(`/products/${productId}`)
    const product = response.product || response
    logDebug('Product detail received', product)
    logDebug('Product image URLs', {
      image: product.image,
      imageUrl: product.imageUrl,
      images: product.images,
    })
    return {
      success: true,
      product,
    }
  } catch (error) {
    logError('Error fetching product', error)
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
    logError('Error fetching categories', error)
    return {
      success: false,
      error: error.message,
      categories: [],
    }
  }
}

/**
 * Get reviews for a specific product
 * @param {string} productId - Product ID
 */
export const getProductReviews = async productId => {
  try {
    const response = await apiClient.get(`/products/${productId}/reviews`)
    return {
      success: true,
      reviews: response.reviews || [],
      averageRating: response.averageRating ?? 5.0,
      totalReviews: response.totalReviews ?? 0,
    }
  } catch (error) {
    logError('Error fetching product reviews', error)
    return {
      success: false,
      reviews: [],
      averageRating: 5.0,
      totalReviews: 0,
    }
  }
}


