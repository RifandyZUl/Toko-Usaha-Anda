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

/**
 * Get shipping tracking data for an order
 * @param {string} orderId - Order ID
 */
export const getOrderTracking = async orderId => {
  try {
    const response = await apiClient.get(`/orders/${orderId}/tracking`)
    return {
      success: true,
      tracking: response.tracking,
    }
  } catch (error) {
    logError('Error fetching order tracking', error)
    return {
      success: false,
      error: error.message,
      tracking: null,
    }
  }
}

/**
 * Confirm order completion / received
 * @param {string} orderId - Order ID
 */
export const completeOrder = async orderId => {
  try {
    const response = await apiClient.post(`/orders/${orderId}/complete`)
    return {
      success: true,
      message: response.message,
      order: response.order,
    }
  } catch (error) {
    logError('Error completing order', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * File an official dispute / return request
 * @param {string} orderId - Order ID
 * @param {Object} disputeData - { reason, description, solutionExpected }
 */
export const createOrderDispute = async (orderId, disputeData) => {
  try {
    const response = await apiClient.post(`/orders/${orderId}/dispute`, disputeData)
    return {
      success: true,
      message: response.message,
      order: response.order,
    }
  } catch (error) {
    logError('Error submitting dispute', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Submit product review & rating for a completed order
 * @param {string} orderId - Order ID
 * @param {Object} reviewData - { productId, rating, comment }
 */
export const createOrderReview = async (orderId, reviewData) => {
  try {
    const response = await apiClient.post(`/orders/${orderId}/review`, reviewData)
    return {
      success: true,
      message: response.message,
      review: response.review,
    }
  } catch (error) {
    logError('Error submitting review', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Handle COD rejection / return to warehouse (Admin)
 * @param {string} orderId - Order ID
 * @param {string} reason - Optional reason
 */
export const rejectCodOrder = async (orderId, reason) => {
  try {
    const response = await apiClient.post(`/orders/${orderId}/reject-cod`, { reason })
    return {
      success: true,
      message: response.message,
      order: response.order,
    }
  } catch (error) {
    logError('Error processing COD rejection', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Check customer COD eligibility and phone verification status
 */
export const checkCodEligibility = async (phone, amount) => {
  try {
    const response = await apiClient.get('/orders/cod-eligibility', { phone, amount })
    return {
      success: true,
      ...response,
    }
  } catch (error) {
    logError('Error checking COD eligibility', error)
    return {
      success: false,
      eligible: false,
      error: error.message,
    }
  }
}




