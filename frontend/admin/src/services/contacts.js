/**
 * Contacts API Service
 * Handles customer contact message operations for admin
 */

import { apiClient } from '../config/api.js'
import { handleApiError } from '../utils/errorHandler.js'
import { logError } from '../utils/logger.js'

/**
 * Get all contact messages with optional filters
 * @param {Object} params - Query parameters (page, limit, status)
 * @returns {Promise<Object>}
 */
export const getContactMessages = async (params = {}) => {
  try {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page)
    if (params.limit) query.append('limit', params.limit)
    if (params.status && params.status !== 'ALL') query.append('status', params.status)

    const endpoint = `/contact${query.toString() ? `?${query.toString()}` : ''}`
    const response = await apiClient.get(endpoint)

    return {
      success: true,
      messages: response.messages || [],
      unreadCount: response.unreadCount || 0,
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
      error: null,
    }
  } catch (error) {
    logError('Error fetching contact messages', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal mengambil pesan kontak'),
      messages: [],
      unreadCount: 0,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    }
  }
}

/**
 * Update contact message status (UNREAD, READ, REPLIED, ARCHIVED)
 * @param {string} id - Contact Message ID
 * @param {string} status - New status
 * @returns {Promise<Object>}
 */
export const updateContactStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/contact/${id}/status`, { status })
    return {
      success: true,
      contact: response.contact,
      message: response.message || 'Status berhasil diperbarui',
      error: null,
    }
  } catch (error) {
    logError('Error updating contact status', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal memperbarui status pesan'),
    }
  }
}

/**
 * Delete a contact message
 * @param {string} id - Contact Message ID
 * @returns {Promise<Object>}
 */
export const deleteContactMessage = async (id) => {
  try {
    const response = await apiClient.delete(`/contact/${id}`)
    return {
      success: true,
      message: response.message || 'Pesan berhasil dihapus',
      error: null,
    }
  } catch (error) {
    logError('Error deleting contact message', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal menghapus pesan kontak'),
    }
  }
}
