/**
 * Loading Component
 * Reusable loading spinner component
 */

/**
 * @param {Object} props
 * @param {string} props.message - Loading message
 * @param {string} props.size - Size variant (sm, md, lg)
 */
export default function Loading({ message = 'Memuat...', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full border-t-2 border-b-2 border-primary-600 ${sizeClasses[size]}`}
        />
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    </div>
  )
}

