import { useState } from 'react'

/**
 * Hook for managing toast notifications
 * @returns {Object} Toast management functions
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = (message, variant = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, variant, duration }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
    
    return id
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message, duration) => showToast(message, 'success', duration)
  const error = (message, duration) => showToast(message, 'error', duration)
  const warning = (message, duration) => showToast(message, 'warning', duration)
  const info = (message, duration) => showToast(message, 'info', duration)

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}

