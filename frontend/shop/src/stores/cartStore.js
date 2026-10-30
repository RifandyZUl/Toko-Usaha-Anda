import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncCartToBackend } from '../services/cart'

/**
 * Helper to get unique key for a cart item
 */
export const getItemKey = (item) => {
  if (!item) return ''
  return item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)
}

/**
 * Helper to automatically sync cart changes to backend database if user is logged in
 */
const syncIfAuthenticated = (items) => {
  try {
    const authStorage = typeof window !== 'undefined' ? window.localStorage?.getItem('toko-auth-storage') : null
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      if (parsed?.state?.user?.id) {
        syncCartToBackend(items, 'replace').catch(e => {
          console.warn('Auto cart sync to backend failed:', e)
        })
      }
    }
  } catch (e) {}
}

/**
 * Cart Store menggunakan Zustand
 * State management untuk shopping cart dengan dukungan seleksi checkout per item
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      selectedItemKeys: [], // Keys of items selected for checkout
      isOpen: false,

      // Actions
      addItem: (product, quantity = 1) => {
        const items = get().items
        const cartKey = getItemKey(product)
        const existingItem = items.find(item => getItemKey(item) === cartKey)
        const maxStock = typeof product.stock === 'number' ? product.stock : 9999

        if (maxStock <= 0) return // Don't add out of stock products

        let updatedItems = []
        if (existingItem) {
          const newQty = Math.min(existingItem.quantity + quantity, maxStock)
          updatedItems = items.map(item =>
            getItemKey(item) === cartKey
              ? { ...item, ...product, cartKey, quantity: newQty }
              : item
          )
        } else {
          const initialQty = Math.min(Math.max(1, quantity), maxStock)
          updatedItems = [...items, { ...product, cartKey, quantity: initialQty }]
        }

        // Auto-select newly added item
        const currentSelected = get().selectedItemKeys || []
        const updatedSelected = currentSelected.includes(cartKey)
          ? currentSelected
          : [...currentSelected, cartKey]

        set({ items: updatedItems, selectedItemKeys: updatedSelected })
        syncIfAuthenticated(updatedItems)
      },

      removeItem: cartKeyOrId => {
        const remainingItems = get().items.filter(
          item => getItemKey(item) !== cartKeyOrId && item.id !== cartKeyOrId
        )
        const updatedSelected = (get().selectedItemKeys || []).filter(
          k => k !== cartKeyOrId
        )
        set({ items: remainingItems, selectedItemKeys: updatedSelected })
        syncIfAuthenticated(remainingItems)
      },

      removeItemsByKeys: (keysToRemove = []) => {
        const keySet = new Set(keysToRemove)
        const remainingItems = get().items.filter(item => !keySet.has(getItemKey(item)))
        const updatedSelected = (get().selectedItemKeys || []).filter(k => !keySet.has(k))
        set({ items: remainingItems, selectedItemKeys: updatedSelected })
        syncIfAuthenticated(remainingItems)
      },

      updateQuantity: (cartKeyOrId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartKeyOrId)
          return
        }

        const items = get().items
        const targetItem = items.find(
          item => getItemKey(item) === cartKeyOrId || item.id === cartKeyOrId
        )
        const maxStock = targetItem && typeof targetItem.stock === 'number' ? targetItem.stock : 9999
        const finalQty = Math.min(quantity, maxStock)

        const updatedItems = items.map(item =>
          getItemKey(item) === cartKeyOrId || item.id === cartKeyOrId
            ? { ...item, quantity: finalQty }
            : item
        )

        set({ items: updatedItems })
        syncIfAuthenticated(updatedItems)
      },

      clearCart: () => {
        set({ items: [], selectedItemKeys: [] })
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem('toko-cart-storage')
          }
        } catch (e) {
          console.error('Failed to clear cart storage:', e)
        }
      },

      setItems: (newItems = []) => {
        set({
          items: newItems,
          selectedItemKeys: newItems.map(it => getItemKey(it)),
        })
      },

      // Selection actions for selective checkout
      toggleSelectItem: (cartKey) => {
        const current = get().selectedItemKeys || []
        if (current.includes(cartKey)) {
          set({ selectedItemKeys: current.filter(k => k !== cartKey) })
        } else {
          set({ selectedItemKeys: [...current, cartKey] })
        }
      },

      selectAllItems: (selectAll = true) => {
        if (selectAll) {
          const allKeys = get().items.map(it => getItemKey(it))
          set({ selectedItemKeys: allKeys })
        } else {
          set({ selectedItemKeys: [] })
        }
      },

      setSelectedKeys: (keys = []) => {
        set({ selectedItemKeys: keys })
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      // Getters
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getSelectedItems: () => {
        const items = get().items
        const selected = get().selectedItemKeys
        // If not initialized or empty, default to all items
        if (!selected || selected.length === 0) {
          return []
        }
        return items.filter(it => selected.includes(getItemKey(it)))
      },

      getSelectedTotalPrice: () => {
        const selectedItems = get().getSelectedItems()
        return selectedItems.reduce(
          (total, item) => total + Number(item.price) * item.quantity,
          0
        )
      },

      getSelectedTotalItems: () => {
        const selectedItems = get().getSelectedItems()
        return selectedItems.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'toko-cart-storage', // localStorage key
    }
  )
)
