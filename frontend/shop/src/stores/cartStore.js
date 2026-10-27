import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Cart Store menggunakan Zustand
 * State management untuk shopping cart
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      isOpen: false,

      // Actions
      addItem: (product, quantity = 1) => {
        const items = get().items
        const cartKey = product.variantId ? `${product.id}-${product.variantId}` : product.id
        const existingItem = items.find(
          item => (item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)) === cartKey
        )
        const maxStock = typeof product.stock === 'number' ? product.stock : 9999

        if (maxStock <= 0) return // Don't add out of stock products

        if (existingItem) {
          const newQty = Math.min(existingItem.quantity + quantity, maxStock)
          set({
            items: items.map(item =>
              (item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)) === cartKey
                ? { ...item, ...product, cartKey, quantity: newQty }
                : item
            ),
          })
        } else {
          const initialQty = Math.min(Math.max(1, quantity), maxStock)
          set({
            items: [...items, { ...product, cartKey, quantity: initialQty }],
          })
        }
      },

      removeItem: cartKeyOrId => {
        set({
          items: get().items.filter(
            item =>
              (item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)) !== cartKeyOrId &&
              item.id !== cartKeyOrId
          ),
        })
      },

      updateQuantity: (cartKeyOrId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartKeyOrId)
          return
        }

        const items = get().items
        const targetItem = items.find(
          item =>
            (item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)) === cartKeyOrId ||
            item.id === cartKeyOrId
        )
        const maxStock = targetItem && typeof targetItem.stock === 'number' ? targetItem.stock : 9999
        const finalQty = Math.min(quantity, maxStock)

        set({
          items: items.map(item =>
            (item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)) === cartKeyOrId ||
            item.id === cartKeyOrId
              ? { ...item, quantity: finalQty }
              : item
          ),
        })
      },

      clearCart: () => {
        set({ items: [] })
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
    }),
    {
      name: 'toko-cart-storage', // localStorage key
    }
  )
)
