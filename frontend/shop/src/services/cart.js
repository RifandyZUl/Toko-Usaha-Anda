import { apiClient } from '../config/api.js'
import { logError } from '../utils/logger.js'

/**
 * Cart API Service
 */

/**
 * Get user cart
 */
export const getCart = async () => {
  try {
    const response = await apiClient.get('/cart')
    return {
      success: true,
      items: response.cartItems || [],
      total: response.total || 0,
    }
  } catch (error) {
    logError('Error fetching cart', error)
    return {
      success: false,
      error: error.message,
      items: [],
      total: 0,
    }
  }
}

/**
 * Add item to cart
 * @param {Object} data - Cart item data
 * @param {string} data.productId - Product ID
 * @param {string} [data.variantId] - Variant ID (optional)
 * @param {number} [data.quantity] - Quantity
 */
export const addToCart = async ({ productId, variantId = null, quantity = 1 }) => {
  try {
    const response = await apiClient.post('/cart', { productId, variantId, quantity })
    return {
      success: true,
      cartItem: response.cartItem,
      message: response.message,
    }
  } catch (error) {
    logError('Error adding to cart', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update cart item quantity
 * @param {string} itemId - Cart item ID
 * @param {number} quantity - New quantity
 */
export const updateCartItem = async (itemId, quantity) => {
  try {
    const response = await apiClient.put(`/cart/${itemId}`, { quantity })
    return {
      success: true,
      cartItem: response.cartItem,
      message: response.message,
    }
  } catch (error) {
    logError('Error updating cart item', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Remove item from cart
 * @param {string} itemId - Cart item ID
 */
export const removeFromCart = async itemId => {
  try {
    await apiClient.delete(`/cart/${itemId}`)
    return {
      success: true,
    }
  } catch (error) {
    logError('Error removing from cart', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Clear cart
 */
export const clearCart = async () => {
  try {
    await apiClient.delete('/cart')
    return { success: true }
  } catch (error) {
    logError('Error clearing cart', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Sync local cart to backend atomically
 * @param {Array} localItems - Local cart items from Zustand store
 * @param {'replace'|'merge'} [mode='replace'] - Sync mode
 */
export const syncCartToBackend = async (localItems, mode = 'replace') => {
  try {
    const formattedItems = (localItems || []).map(item => ({
      productId: String(item.id),
      variantId: item.variantId || null,
      quantity: item.quantity || 1,
    }))

    const response = await apiClient.post('/cart/sync', { items: formattedItems, mode })
    return { success: response.success ?? true }
  } catch (error) {
    logError('Error syncing cart', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

