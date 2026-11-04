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

