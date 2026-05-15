/**
 * Admin Authentication Store
 * Manages authentication state using Zustand with persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginAPI, getCurrentUser, logout as logoutAPI } from '../services/auth.js'
import { apiClient } from '../config/api.js'
import { logError } from '../utils/logger.js'

/**
 * Storage configuration
 */
const STORAGE_CONFIG = {
  name: 'toko-admin-auth-storage',
  version: 1,
}

/**
 * User role constant
 */
const USER_ROLE = {
  ADMIN: 'ADMIN',
}

/**
 * Create auth store with persistence
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      error: null,

      /**
       * Set authentication data
       * @param {Object} user - User object
       * @param {string} token - Authentication token
       */
      setAuth: (user, token) => {
        set({ user, token, error: null })
        // Update API client token synchronously
        apiClient.setToken(token)
      },

      /**
       * Clear authentication data
       */
      clearAuth: () => {
        set({ user: null, token: null, error: null })
        logoutAPI()
      },

      /**
       * Login user
       * @param {string} email - User email
       * @param {string} password - User password
       * @returns {Promise<Object>} Login result
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null })

        try {
          const result = await loginAPI({ email, password })

          if (result.success) {
            get().setAuth(result.user, result.token)
            return {
              success: true,
              user: result.user,
              token: result.token,
              error: null,
            }
          } else {
            set({ error: result.error || 'Login gagal' })
            return {
              success: false,
              error: result.error || 'Login gagal',
              user: null,
              token: null,
            }
          }
        } catch (error) {
          const errorMessage =
            error.message || 'Terjadi kesalahan saat melakukan login'
          logError('Login error in store', error)
          set({ error: errorMessage })
          return {
            success: false,
            error: errorMessage,
            user: null,
            token: null,
          }
        } finally {
          set({ isLoading: false })
        }
      },

      /**
       * Logout user
       */
      logout: () => {
        get().clearAuth()
      },

      /**
       * Check authentication status
       * Validates token and refreshes user data
       * @returns {Promise<boolean>} True if authenticated
       */
      checkAuth: async () => {
        const { token } = get()

        if (!token) {
          return false
        }

        try {
          const result = await getCurrentUser()

          if (result.success && result.user) {
            set({ user: result.user, error: null })
            return true
          } else {
            // Token invalid or user not admin
            get().clearAuth()
            return false
          }
        } catch (error) {
          logError('Check auth error', error)
          get().clearAuth()
          return false
        }
      },

      /**
       * Check if user is authenticated
       * @returns {boolean} True if user has valid token and user data
       */
      isAuthenticated: () => {
        const state = get()
        return !!(state.token && state.user)
      },

      /**
       * Check if user is admin
       * @returns {boolean} True if user role is ADMIN
       */
      isAdmin: () => {
        const state = get()
        return state.user?.role === USER_ROLE.ADMIN
      },
    }),
    {
      ...STORAGE_CONFIG,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => async (state) => {
        // Set token to API client after rehydration
        if (state?.token && typeof window !== 'undefined') {
          apiClient.setToken(state.token)
        }
      },
    }
  )
)

