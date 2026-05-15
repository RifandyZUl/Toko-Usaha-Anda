import { apiClient } from '../config/api.js'
import { logError } from '../utils/logger.js'

/**
 * Auth API Service
 */

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.name - User name
 * @param {string} userData.password - User password
 * @param {string} userData.phone - User phone (optional)
 */
export const register = async userData => {
  try {
    const response = await apiClient.post('/auth/register', userData)
    
    // Store token if provided
    if (response.token) {
      apiClient.setToken(response.token)
    }

    return {
      success: true,
      token: response.token,
      user: response.user,
    }
  } catch (error) {
    logError('Error registering user', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 */
export const login = async credentials => {
  try {
    const response = await apiClient.post('/auth/login', credentials)
    
    // Store token
    if (response.token) {
      apiClient.setToken(response.token)
    }

    return {
      success: true,
      token: response.token,
      user: response.user,
    }
  } catch (error) {
    logError('Error logging in', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get current user (requires authentication)
 */
export const getCurrentUser = async () => {
  try {
    const user = await apiClient.get('/auth/me')
    return {
      success: true,
      user,
    }
  } catch (error) {
    logError('Error fetching current user', error)
    return {
      success: false,
      error: error.message,
      user: null,
    }
  }
}

/**
 * Logout user
 */
export const logout = () => {
  apiClient.setToken(null)
  return {
    success: true,
  }
}

