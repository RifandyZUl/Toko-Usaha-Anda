/**
 * Orders API Service
 * Handles all order-related API calls for admin
 */

import { apiClient, ApiError } from '../config/api.js'
import { handleApiError } from '../utils/errorHandler.js'
import { ORDER_STATUS } from '../constants/orderStatus.js'
import { logError } from '../utils/logger.js'

/**
 * Get all orders (Admin can see all orders from all users)
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by order status
 * @returns {Promise<Object>} Orders data
 */
export const getAllOrders = async (params = {}) => {
  try {
    const response = await apiClient.get('/orders', { all: 'true', ...params })
    return {
      success: true,
      orders: response.orders || [],
      error: null,
    }
  } catch (error) {
    logError('Error fetching orders', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal mengambil data pesanan'),
      orders: [],
    }
  }
}

/**
 * Get order by ID
 * @param {string} id - Order ID
 * @returns {Promise<Object>} Order data
 */
export const getOrderById = async (id) => {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID pesanan tidak valid',
        order: null,
      }
    }

    const response = await apiClient.get(`/orders/${id}`)
    return {
      success: true,
      order: response.order || response,
      error: null,
    }
  } catch (error) {
    logError('Error fetching order', error)

    if (error instanceof ApiError && error.status === 404) {
      return {
        success: false,
        error: 'Pesanan tidak ditemukan',
        order: null,
      }
    }

    return {
      success: false,
      error: handleApiError(error, 'Gagal mengambil data pesanan'),
      order: null,
    }
  }
}

/**
 * Update order status (Admin only)
 * @param {string} id - Order ID
 * @param {string} status - New order status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
 * @returns {Promise<Object>} Updated order data
 */
export const updateOrderStatus = async (id, status) => {
  try {
    if (!id) {
      return {
        success: false,
        error: 'ID pesanan tidak valid',
        order: null,
        message: null,
      }
    }

    if (!status || !Object.values(ORDER_STATUS).includes(status)) {
      return {
        success: false,
        error: 'Status pesanan tidak valid',
        order: null,
        message: null,
      }
    }

    const response = await apiClient.put(`/orders/${id}/status`, { status })
    return {
      success: true,
      order: response.order || response,
      message: response.message || 'Status pesanan berhasil diperbarui',
      error: null,
    }
  } catch (error) {
    logError('Error updating order status', error)

    if (error instanceof ApiError && error.status === 404) {
      return {
        success: false,
        error: 'Pesanan tidak ditemukan',
        order: null,
        message: null,
      }
    }

    return {
      success: false,
      error: handleApiError(error, 'Gagal memperbarui status pesanan'),
      order: null,
      message: null,
    }
  }
}

