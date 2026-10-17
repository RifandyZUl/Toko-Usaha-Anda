import { apiClient } from '../config/api.js'
import { logError } from '../utils/logger.js'

/**
 * Orders API Service
 */

/**
 * Create order
 * @param {Object} orderData - Order data
 * @param {string} [idempotencyKey] - Optional unique idempotency key
 */
export const createOrder = async (orderData, idempotencyKey) => {
  try {
    const customHeaders = idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}
    const response = await apiClient.post('/orders', orderData, customHeaders)
    return {
      success: true,
      order: response.order,
      snapToken: response.snapToken,
      redirectUrl: response.redirectUrl,
      message: response.message,
    }
  } catch (error) {
    logError('Error creating order', error)
    return {
      success: false,
      error: error.message,
      errors: error.errors,
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

/**
 * Simulate order payment (development only)
 * @param {string} orderId - Order ID
 */
export const simulateOrderPayment = async orderId => {
  try {
    const response = await apiClient.post('/payment/simulate', { orderId })
    return {
      success: true,
      message: response.message,
    }
  } catch (error) {
    logError('Error simulating order payment', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Cancel order
 * @param {string} orderId - Order ID
 */
export const cancelOrder = async orderId => {
  try {
    const response = await apiClient.post(`/orders/${orderId}/cancel`)
    return {
      success: true,
      message: response.message,
      order: response.order,
    }
  } catch (error) {
    logError('Error cancelling order', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

