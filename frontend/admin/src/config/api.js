/**
 * API Configuration
 * Centralized API client with error handling, timeout, and retry logic
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const REQUEST_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 2
const RETRY_DELAY = 1000 // 1 second

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  AUTH_TOKEN: 'admin_auth_token',
}

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Base API client with enhanced error handling and retry logic
 */
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
    this.token = null
  }

  /**
   * Set authentication token
   * @param {string|null} token - Authentication token
   */
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    }
  }

  /**
   * Get authentication token from storage
   * @returns {string|null} Authentication token
   */
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    }
    return this.token
  }

  /**
   * Build request headers
   * @returns {Object} Request headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }

    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Create fetch request with timeout and credentials
   * @param {string} url - Request URL
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithTimeout(url, options) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // CRITICAL: Send cookies with requests
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408)
      }
      throw error
    }
  }

  /**
   * Handle API response with proper error handling
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Parsed response data
   * @throws {ApiError} If response is not ok
   */
  async handleResponse(response) {
    // Handle unauthorized (401)
    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      // Clear local token on 401
      this.setToken(null)
    }

    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    let data = {}
    try {
      if (isJson) {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      }
    } catch (error) {
      // Silently handle parse errors
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP Error ${response.status}`
      throw new ApiError(errorMessage, response.status, data)
    }

    return data
  }

  /**
   * Execute request with retry logic
   * @param {Function} requestFn - Request function to execute
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<Object>} Response data
   */
  async executeWithRetry(requestFn, retries = MAX_RETRIES) {
    try {
      return await requestFn()
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== HTTP_STATUS.UNAUTHORIZED
      ) {
        throw error
      }

      if (retries > 0) {
        await sleep(RETRY_DELAY)
        return this.executeWithRetry(requestFn, retries - 1)
      }

      throw error
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`)
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key])
      }
    })

    return this.executeWithRetry(async () => {
      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      })
      return this.handleResponse(response)
    })
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.executeWithRetry(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${endpoint}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        }
      )
      return this.handleResponse(response)
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.executeWithRetry(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${endpoint}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        }
      )
      return this.handleResponse(response)
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.executeWithRetry(async () => {
      const response = await this.fetchWithTimeout(
        `${this.baseURL}${endpoint}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      )
      return this.handleResponse(response)
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export error class for use in components
export { ApiError }

