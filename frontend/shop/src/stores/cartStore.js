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
 * Filter cart items down to those selected for checkout
 */
export const filterSelectedItems = (items = [], selectedKeys = []) => {
  const keySet = new Set(selectedKeys)
  return items.filter(item => keySet.has(getItemKey(item)))
}

/**
 * Insert or update a cart item, clamped to available stock.
 * - replaceQuantity=false: adds `quantity` on top of the existing quantity (Add to Cart)
 * - replaceQuantity=true: sets the quantity exactly to `quantity` (Buy Now)
 * Returns null when the product is out of stock.
 */
const upsertItem = (items, product, quantity, { replaceQuantity = false } = {}) => {
  const maxStock = typeof product.stock === 'number' ? product.stock : 9999
  if (maxStock <= 0) return null

  const cartKey = getItemKey(product)
  const existingItem = items.find(item => getItemKey(item) === cartKey)
  const baseQty = existingItem && !replaceQuantity ? existingItem.quantity : 0
  const finalQty = Math.min(Math.max(1, baseQty + quantity), maxStock)
  const updatedItem = { ...existingItem, ...product, cartKey, quantity: finalQty }

  const updatedItems = existingItem
    ? items.map(item => (getItemKey(item) === cartKey ? updatedItem : item))
    : [...items, updatedItem]

  return { cartKey, updatedItems }
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
  } catch (err) {
    console.debug('Skip background cart sync:', err?.message)
  }
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
      // Adds to cart without touching the checkout selection (user picks manually in CartPage)
      addItem: (product, quantity = 1) => {
        const result = upsertItem(get().items, product, quantity)
        if (!result) return

        set({ items: result.updatedItems })
        syncIfAuthenticated(result.updatedItems)
      },

      // Buy Now: put the product in the cart with the exact quantity and select ONLY it for checkout
      buyNow: (product, quantity = 1) => {
        const result = upsertItem(get().items, product, quantity, { replaceQuantity: true })
        if (!result) return false

        set({ items: result.updatedItems, selectedItemKeys: [result.cartKey] })
        syncIfAuthenticated(result.updatedItems)
        return true
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

      // Replace cart items (e.g. after login sync) while keeping only still-valid selections
      setItems: (newItems = []) => {
        const validKeys = new Set(newItems.map(it => getItemKey(it)))
        const keptSelection = (get().selectedItemKeys || []).filter(k => validKeys.has(k))
        set({ items: newItems, selectedItemKeys: keptSelection })
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

      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },

      // Getters
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'toko-cart-storage', // localStorage key
    }
  )
)
