import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login, register, getCurrentUser, logout as logoutAPI } from '../services/auth'
import { getCart, syncCartToBackend } from '../services/cart'
import { useCartStore } from './cartStore'

const authChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('toko_auth_sync')
    : null

/**
 * Auth Store using Zustand
 * Manages authentication state and cross-session cart sync
 */
export const useAuthStore = create(
  persist(
    (set, get) => {
      if (authChannel) {
        authChannel.onmessage = (event) => {
          if (event.data?.type === 'LOGOUT') {
            set({ user: null, error: null })
            try {
              useCartStore.getState().clearCart()
            } catch (e) {
              console.error('Failed to clear cart on sync logout:', e)
            }
          } else if (event.data?.type === 'LOGIN') {
            get().checkAuth()
          }
        }
      }

      return {
        // State
        user: null,
        isLoading: false,
        error: null,

        // Actions
        fetchUserCart: async () => {
          const currentUser = get().user
          if (!currentUser?.id) return

          try {
            // Cek apakah ada backup offline keranjang dari sesi logout sebelumnya yang terputus koneksi
            const pendingKey = `toko-pending-cart-${currentUser.id}`
            const pendingData = typeof window !== 'undefined' ? window.localStorage?.getItem(pendingKey) : null
            if (pendingData) {
              try {
                const parsedPending = JSON.parse(pendingData)
                if (Array.isArray(parsedPending) && parsedPending.length > 0) {
                  await syncCartToBackend(parsedPending, 'merge')
                  window.localStorage?.removeItem(pendingKey)
                }
              } catch (pendingErr) {
                console.error('Failed to sync pending offline cart:', pendingErr)
              }
            }

            const cartRes = await getCart()
            if (cartRes.success && Array.isArray(cartRes.items) && cartRes.items.length > 0) {
              const formatted = cartRes.items.map(item => {
                const prod = item.product || {}
                const effectivePrice = item.variant
                  ? Number(item.variant.price)
                  : Number(prod.price || item.price || 0)
                const effectiveStock = item.variant ? item.variant.stock : (prod.stock || 0)
                return {
                  id: prod.id || item.productId,
                  name: prod.name || 'Produk',
                  price: effectivePrice,
                  image: prod.imageUrl || prod.image || '/placeholder.jpg',
                  stock: effectiveStock,
                  variantId: item.variantId || null,
                  variantName: item.variantName || item.variant?.name || null,
                  quantity: item.quantity || 1,
                }
              })
              useCartStore.getState().setItems(formatted)
            }
          } catch (cartErr) {
            console.warn('Could not sync user cart from backend:', cartErr)
          }
        },

        setAuth: async (user) => {
          const unwrapped = user?.user || user
          set({ user: unwrapped, error: null })
          authChannel?.postMessage({ type: 'LOGIN' })

          // Restore user's cart from backend if authenticated
          if (unwrapped) {
            await get().fetchUserCart()
          }
        },

      /**
       * Clear auth state locally only (no API call).
       * Used when auth check fails or token is invalid.
       */
      clearAuth: () => {
        set({ user: null, error: null })
        try {
          useCartStore.getState().clearCart()
        } catch (e) {
          console.error('Failed to clear cart on clearAuth:', e)
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await login({ email, password })
          if (result.success) {
            await get().setAuth(result.user)
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
            await get().setAuth(result.user)
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
       * User-initiated logout:
       * 1. Mencoba menyimpan keranjang aktif ke database backend sebelum logout.
       * 2. Jika koneksi putus/timeout, simpan backup offline terisolasi (toko-pending-cart-${userId})
       *    sehingga produk tidak hilang dan otomatis tersinkron saat user login kembali.
       * 3. Selalu memprioritaskan keamanan dengan langsung mengosongkan state keranjang lokal agar tamu tidak bisa melihatnya.
       * 4. Menghapus cookie otentikasi di server.
       */
      logout: async () => {
        const currentUser = get().user
        const currentItems = useCartStore.getState().items

        // 1. Simpan keranjang ke server jika ada item aktif (dibatasi timeout 2 detik)
        if (currentUser?.id && currentItems && currentItems.length > 0) {
          try {
            const syncPromise = syncCartToBackend(currentItems, 'replace')
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Logout sync timeout')), 2000)
            )
            await Promise.race([syncPromise, timeoutPromise])
            // Berhasil sinkronisasi, bersihkan backup offline jika ada
            if (typeof window !== 'undefined') {
              window.localStorage?.removeItem(`toko-pending-cart-${currentUser.id}`)
            }
          } catch (syncErr) {
            console.warn('Network issue during logout. Storing offline user cart backup:', syncErr.message)
            try {
              if (typeof window !== 'undefined') {
                window.localStorage?.setItem(
                  `toko-pending-cart-${currentUser.id}`,
                  JSON.stringify(currentItems)
                )
              }
            } catch (storageErr) {
              console.error('Failed to store pending cart backup:', storageErr)
            }
          }
        }

        // 2. Clear user state
        set({ user: null, error: null })

        // 3. Selalu kosongkan keranjang lokal agar aman dan tidak terlihat oleh pengguna tamu
        try {
          useCartStore.getState().clearCart()
        } catch (e) {
          console.error('Failed to clear cart on logout:', e)
        }

        authChannel?.postMessage({ type: 'LOGOUT' })

        try {
          await logoutAPI()
        } catch {
          // Even if API call fails, local state is already cleared
        }
      },

      checkAuth: async () => {
        try {
          const result = await getCurrentUser()
          const user = result?.user?.user || result?.user
          if (result.success && user) {
            set({ user })
            // Restore user cart if local cart is empty
            if (useCartStore.getState().items.length === 0) {
              await get().fetchUserCart()
            }
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
    }
  },
  {
    name: 'toko-auth-storage', // localStorage key
    partialize: (state) => ({
      user: state.user,
    }),
  }
)
)

