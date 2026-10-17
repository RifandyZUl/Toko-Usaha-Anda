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
      isLoading: false,
      error: null,

      // Actions
      setAuth: (user) => {
        set({ user, error: null })
      },

      /**
       * Clear auth state locally only (no API call).
       * Used when auth check fails or token is invalid.
       */
      clearAuth: () => {
        set({ user: null, error: null })
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await login({ email, password })
          if (result.success) {
            get().setAuth(result.user)
            return { success: true }
          } else {
            set({ error: result.error || 'Login failed' })
            return { success: false, error: result.error, errors: result.errors }
          }
        } catch (error) {
          const errorMessage = error.message || 'Login failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage, errors: error.errors }
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const result = await register(userData)
          if (result.success) {
            get().setAuth(result.user)
            return { success: true }
          } else {
            set({ error: result.error || 'Registration failed' })
            return { success: false, error: result.error, errors: result.errors }
          }
        } catch (error) {
          const errorMessage = error.message || 'Registration failed'
          set({ error: errorMessage })
          return { success: false, error: errorMessage, errors: error.errors }
        } finally {
          set({ isLoading: false })
        }
      },

      /**
       * User-initiated logout — clears state AND calls backend to clear HttpOnly cookie.
       */
      logout: async () => {
        set({ user: null, error: null })
        try {
          await logoutAPI()
        } catch {
          // Even if API call fails, local state is already cleared
        }
      },

      checkAuth: async () => {
        try {
          const result = await getCurrentUser()
          if (result.success && result.user) {
            set({ user: result.user })
            return true
          } else {
            // Only clear local state — don't call logout API
            get().clearAuth()
            return false
          }
        } catch (error) {
          // 401 is expected when not logged in — just clear local state
          get().clearAuth()
          return false
        }
      },

      // Getters
      isAuthenticated: () => {
        return !!get().user
      },

      isAdmin: () => {
        return get().user?.role === 'ADMIN'
      },
    }),
    {
      name: 'toko-auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
)

