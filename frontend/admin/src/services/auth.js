/**
 * Admin Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient, ApiError } from '../config/api.js'
import { handleApiError } from '../utils/errorHandler.js'
import { logError } from '../utils/logger.js'

/**
 * User roles
 */
const USER_ROLE = {
  ADMIN: 'ADMIN',
  USER: 'USER',
}

/**
 * Login admin user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Admin email address
 * @param {string} credentials.password - Admin password
 * @returns {Promise<Object>} Login result with success status, token, user, and error
 */
export const login = async (credentials) => {
  try {
    const { email, password } = credentials

    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email dan password harus diisi',
        token: null,
        user: null,
      }
    }

    const response = await apiClient.post('/auth/login', { email, password })
    const user = response?.user || response
    const token = response?.token || null

    // Store token if provided
    if (token) {
      apiClient.setToken(token)
    }

    // Verify user is admin
    if (user?.role !== USER_ROLE.ADMIN) {
      apiClient.setToken(null)
      return {
        success: false,
        error: 'Akses ditolak. Hanya akun admin yang diizinkan.',
        token: null,
        user: null,
      }
    }

    return {
      success: true,
      token,
      user,
      error: null,
    }
  } catch (error) {
    logError('Login error', error)
    return {
      success: false,
      error: handleApiError(error, 'Gagal melakukan login'),
      token: null,
      user: null,
    }
  }
}

/**
 * Get current authenticated admin user
 * Requires valid authentication token
 * @returns {Promise<Object>} User data with success status
 */
export const getCurrentUser = async () => {
  try {
    const data = await apiClient.get('/auth/me')
    const user = data?.user || data

    // Verify user is admin
    if (!user || user.role !== USER_ROLE.ADMIN) {
      return {
        success: false,
        error: 'Akses ditolak. Hanya akun admin yang diizinkan.',
        user: null,
      }
    }

    return {
      success: true,
      user,
      error: null,
    }
  } catch (error) {
    logError('Get current user error', error)

    // Handle unauthorized (token expired/invalid)
    if (error instanceof ApiError && error.status === 401) {
      apiClient.setToken(null)
      return {
        success: false,
        error: 'Sesi telah berakhir. Silakan login kembali.',
        user: null,
      }
    }

    return {
      success: false,
      error: handleApiError(error, 'Gagal mengambil data user'),
      user: null,
    }
  }
}

/**
 * Logout admin user
 * Clears authentication token from storage
 * @returns {Object} Logout result
 */
export const logout = async () => {
  try {
    // Call server-side logout to clear HttpOnly cookie
    await apiClient.post('/auth/logout')
    
    // Clear local state
    apiClient.setToken(null)
    
    return {
      success: true,
      error: null,
    }
  } catch (error) {
    logError('Logout error', error)
    // Even if server call fails, we clear local token
    apiClient.setToken(null)
    return {
      success: true, // Return success anyway to let user leave the page
      error: null,
    }
  }
}

