import { create } from 'zustand'

export const useAlertStore = create((set, get) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'info', // 'info' | 'success' | 'error' | 'warning'
  confirmText: 'OK',
  cancelText: 'Batal',
  isConfirm: false,
  isDestructive: false,
  showIcon: true,
  resolvePromise: null,

  // Toast state
  toast: null,

  showAlert: ({ title = 'Pemberitahuan', message, type = 'info', confirmText = 'Mengerti' }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText: '',
        isConfirm: false,
        isDestructive: false,
        showIcon: true,
        resolvePromise: resolve,
      })
    })
  },

  showConfirm: ({
    title = 'Konfirmasi',
    message,
    type = 'warning',
    confirmText = 'Lanjutkan',
    cancelText = 'Batal',
    isDestructive = false,
    showIcon = true,
  }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        isConfirm: true,
        isDestructive,
        showIcon,
        resolvePromise: resolve,
      })
    })
  },

  showToast: (message, type = 'success', duration = 3500) => {
    const id = Date.now()
    set({ toast: { id, message, type } })
    setTimeout(() => {
      const current = get().toast
      if (current && current.id === id) {
        set({ toast: null })
      }
    }, duration)
  },

  hideToast: () => set({ toast: null }),

  handleConfirm: () => {
    const { resolvePromise } = get()
    set({ isOpen: false })
    if (resolvePromise) resolvePromise(true)
  },

  handleCancel: () => {
    const { resolvePromise } = get()
    set({ isOpen: false })
    if (resolvePromise) resolvePromise(false)
  },
}))
