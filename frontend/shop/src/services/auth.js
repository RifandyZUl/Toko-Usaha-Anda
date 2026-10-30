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
    return {
      success: true,
      user: response.user,
    }
  } catch (error) {
    logError('Error registering user', error)
    return {
      success: false,
      error: error.message,
      errors: error.errors,
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
    return {
      success: true,
      user: response.user,
    }
  } catch (error) {
    logError('Error logging in', error)
    return {
      success: false,
      error: error.message,
      errors: error.errors,
    }
  }
}

/**
 * Get current user (requires authentication)
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me')
    const user = response?.user || response
    return {
      success: true,
      user,
    }
  } catch (error) {
    if (error.message !== 'No authentication token provided' && error.message !== 'Invalid or expired authentication token') {
      logError('Error fetching current user', error)
    }
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
export const logout = async () => {
  try {
    await apiClient.post('/auth/logout')
    return {
      success: true,
    }
  } catch (error) {
    logError('Error logging out', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @param {string} profileData.name - User name
 * @param {string} profileData.phone - User phone
 * @param {string} profileData.address - User address
 */
export const updateProfile = async profileData => {
  try {
    const response = await apiClient.put('/auth/profile', profileData)
    return {
      success: true,
      user: response.user,
      message: response.message,
    }
  } catch (error) {
    logError('Error updating profile', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Send WhatsApp OTP for phone verification
 */
export const sendOtp = async phone => {
  try {
    const response = await apiClient.post('/auth/send-otp', { phone })
    return {
      success: true,
      ...response,
    }
  } catch (error) {
    logError('Error sending OTP', error)
    return {
      success: false,
      error: error.message || 'Gagal mengirim kode OTP.',
    }
  }
}

/**
 * Verify submitted OTP code
 */
export const verifyOtp = async (phone, otp) => {
  try {
    const response = await apiClient.post('/auth/verify-otp', { phone, otp })
    return {
      success: true,
      ...response,
    }
  } catch (error) {
    logError('Error verifying OTP', error)
    return {
      success: false,
      error: error.message || 'Kode OTP tidak valid atau kedaluwarsa.',
    }
  }
}

/**
 * Check if a phone is verified
 */
export const checkPhoneStatus = async phone => {
  try {
    const response = await apiClient.get('/auth/check-phone', { phone })
    return {
      success: true,
      verified: Boolean(response.verified),
    }
  } catch (error) {
    return {
      success: false,
      verified: false,
    }
  }
}

/**
 * Send Email OTP for registration / verification
 */
export const sendEmailOtp = async email => {
  try {
    const response = await apiClient.post('/auth/send-email-otp', { email })
    return {
      success: true,
      ...response,
    }
  } catch (error) {
    logError('Error sending email OTP', error)
    return {
      success: false,
      error: error.message || 'Gagal mengirim kode OTP ke email.',
    }
  }
}

/**
 * Verify Email OTP code
 */
export const verifyEmailOtp = async (email, otp) => {
  try {
    const response = await apiClient.post('/auth/verify-email-otp', { email, otp })
    return {
      success: true,
      ...response,
    }
  } catch (error) {
    logError('Error verifying email OTP', error)
    return {
      success: false,
      error: error.message || 'Kode OTP email tidak valid atau kedaluwarsa.',
    }
  }
}

/**
 * Send OTP via WhatsApp for Registration fallback
 */
export const sendRegisterWaOtp = async (email, phone) => {
  try {
    const response = await apiClient.post('/auth/send-register-wa-otp', { email, phone })
    return {
      success: true,
      ...response,
    }
  } catch (error) {
    logError('Error sending register WA OTP', error)
    return {
      success: false,
      error: error.message || 'Gagal mengirim kode OTP ke WhatsApp.',
    }
  }
}



