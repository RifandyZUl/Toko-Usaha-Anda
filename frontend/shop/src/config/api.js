/**
 * API Configuration
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Base API client
 */
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
    this.token = null
  }

  /**
   * Set authentication token (kept as a no-op for backward compatibility)
   */
  setToken(token) {
    this.token = token
  }

  /**
   * Get authentication token (kept for backward compatibility)
   */
  getToken() {
    return this.token
  }

  /**
   * Build headers
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Handle response
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'An error occurred',
      }))
      const apiError = new Error(error.error || error.message || 'Request failed')
      apiError.status = response.status
      if (response.status === 401) {
        apiError.isAuthError = true
      }
      if (error.errors) {
        apiError.errors = error.errors
      }
      throw apiError
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }

    return {}
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`)
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key])
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    return this.handleResponse(response)
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}, customHeaders = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        ...customHeaders,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    return this.handleResponse(response)
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    })

    return this.handleResponse(response)
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    return this.handleResponse(response)
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

