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
 * @param {number} data.quantity - Quantity
 */
export const addToCart = async ({ productId, quantity = 1 }) => {
  try {
    const response = await apiClient.post('/cart', { productId, quantity })
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
    // Get all cart items first
    const cart = await getCart()
    if (!cart.success) {
      return { success: false, error: cart.error }
    }

    // Delete all items
    const deletePromises = cart.items.map(item => removeFromCart(item.id))
    await Promise.all(deletePromises)

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
 * Sync local cart to backend
 * @param {Array} localItems - Local cart items from Zustand store
 */
export const syncCartToBackend = async localItems => {
  try {
    // Clear backend cart first
    const cart = await getCart()
    if (cart.success && cart.items.length > 0) {
      const deletePromises = cart.items.map(item => removeFromCart(item.id))
      await Promise.all(deletePromises)
    }

    // Add all local items to backend
    const addPromises = localItems.map(item =>
      addToCart({
        productId: item.id.toString(),
        quantity: item.quantity,
      })
    )

    await Promise.all(addPromises)

    return { success: true }
  } catch (error) {
    logError('Error syncing cart', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

