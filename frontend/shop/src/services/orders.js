import { apiClient } from '../config/api.js'
import { logError } from '../utils/logger.js'

/**
 * Orders API Service
 */

/**
 * Create order
 * @param {Object} orderData - Order data
 * @param {string} orderData.shippingAddress - Shipping address
 * @param {string} orderData.shippingPhone - Shipping phone
 * @param {string} orderData.paymentMethod - Payment method
 */
export const createOrder = async orderData => {
  try {
    const response = await apiClient.post('/orders', orderData)
    return {
      success: true,
      order: response.order,
      message: response.message,
    }
  } catch (error) {
    logError('Error creating order', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get user orders
 */
export const getOrders = async () => {
  try {
    const response = await apiClient.get('/orders')
    return {
      success: true,
      orders: response.orders || [],
    }
  } catch (error) {
    logError('Error fetching orders', error)
    return {
      success: false,
      error: error.message,
      orders: [],
    }
  }
}

/**
 * Get all user orders (alias for getOrders)
 */
export const getAllOrders = getOrders

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 */
export const getOrderById = async orderId => {
  try {
    const response = await apiClient.get(`/orders/${orderId}`)
    return {
      success: true,
      order: response.order,
    }
  } catch (error) {
    logError('Error fetching order', error)
    return {
      success: false,
      error: error.message,
      order: null,
    }
  }
}

