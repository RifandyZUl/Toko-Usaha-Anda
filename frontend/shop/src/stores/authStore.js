import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login, register, getCurrentUser, logout as logoutAPI } from '../services/auth'

/**
 * Auth Store using Zustand
 * Manages authentication state
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Actions
      setAuth: (user, token) => {
        set({ user, token, error: null })
        // Update API client token
        import('../config/api.js').then(({ apiClient }) => {
          apiClient.setToken(token)
        })
      },

      clearAuth: () => {
        set({ user: null, token: null, error: null })
        logoutAPI()
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await login({ email, password })
          if (result.success) {
            get().setAuth(result.user, result.token)
            return { success: true }
          } else {
            set({ error: result.error || 'Login failed' })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.message || 'Login failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const result = await register(userData)
          if (result.success) {
            get().setAuth(result.user, result.token)
            return { success: true }
          } else {
            set({ error: result.error || 'Registration failed' })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error.message || 'Registration failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage }
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        get().clearAuth()
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          return false
        }

        try {
          const result = await getCurrentUser()
          if (result.success && result.user) {
            set({ user: result.user })
            return true
          } else {
            get().clearAuth()
            return false
          }
        } catch (error) {
          get().clearAuth()
          return false
        }
      },

      // Getters
      isAuthenticated: () => {
        return !!get().token && !!get().user
      },

      isAdmin: () => {
        return get().user?.role === 'ADMIN'
      },
    }),
    {
      name: 'toko-auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => async (state) => {
        // Set token to API client after rehydration
        if (state?.token && typeof window !== 'undefined') {
          const { apiClient } = await import('../config/api.js')
          apiClient.setToken(state.token)
        }
      },
    }
  )
)

