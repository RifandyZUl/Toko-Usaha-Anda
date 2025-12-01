import { apiClient } from '../config/api.js'

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
    console.error('Error creating order:', error)
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
    console.error('Error fetching orders:', error)
    return {
      success: false,
      error: error.message,
      orders: [],
    }
  }
}

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
    console.error('Error fetching order:', error)
    return {
      success: false,
      error: error.message,
      order: null,
    }
  }
}

