import { useEffect } from 'react'

/**
 * Notification component untuk menampilkan pesan
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 * @param {boolean} isVisible - Visibility state
 * @param {Function} onClose - Close handler
 */
function Notification({ message, type = 'info', isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible || !message) return null

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl max-w-md animate-slide-in-right ${typeStyles[type]}`}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Notification

