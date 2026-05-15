import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

/**
 * Toast Notification Component
 * A modern, animated toast notification system
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls the visibility of the toast
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {string} props.message - Message to display
 * @param {'success'|'error'|'warning'|'info'} [props.variant='success'] - Visual style
 * @param {number} [props.duration=3000] - Auto-close duration in milliseconds
 */
export default function Toast({ isOpen, onClose, message, variant = 'success', duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300) // Match animation duration
  }

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsLeaving(false)

      // Auto-close after duration
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, duration])

  if (!isVisible) return null

  const variantStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-500',
      iconBg: 'bg-green-100',
      iconComponent: <CheckCircle className="h-5 w-5" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      iconBg: 'bg-red-100',
      iconComponent: <XCircle className="h-5 w-5" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500',
      iconBg: 'bg-yellow-100',
      iconComponent: <AlertCircle className="h-5 w-5" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500',
      iconBg: 'bg-blue-100',
      iconComponent: <Info className="h-5 w-5" />,
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={`w-full transition-all duration-300 ${
        isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div
        className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 flex items-start space-x-3`}
      >
        {/* Icon */}
        <div className={`${styles.iconBg} ${styles.icon} p-1.5 rounded-full flex-shrink-0`}>
          {styles.iconComponent}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Toast Container Component
 * Manages multiple toast notifications with stacking
 */
export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index,
          }}
        >
          <Toast
            isOpen={true}
            onClose={() => removeToast(toast.id)}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  )
}
