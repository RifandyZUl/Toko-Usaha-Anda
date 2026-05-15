/**
 * Error Message Component
 * Reusable error message display component
 */

import { AlertCircle, X } from 'lucide-react'

/**
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onDismiss - Callback when error is dismissed
 * @param {string} props.variant - Error variant (error, warning, info)
 */
export default function ErrorMessage({
  message,
  onDismiss,
  variant = 'error',
}) {
  if (!message) return null

  const variantClasses = {
    error: 'bg-red-50 border-red-200 text-red-600',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
  }

  return (
    <div
      className={`mb-4 p-4 border rounded-lg flex items-start justify-between ${variantClasses[variant]}`}
    >
      <div className="flex items-start space-x-3 flex-1">
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <p className="text-sm flex-1">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Tutup pesan error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

