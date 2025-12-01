import Icon from '@shared/components/Icon.jsx'
import { Button } from '@shared/components'

/**
 * Error Message Component
 */
function ErrorMessage({ 
  message = 'Terjadi kesalahan', 
  onRetry = null,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}>
      <div className="text-red-500">
        <Icon name="AlertCircle" size={48} />
      </div>
      <div className="text-center">
        <p className="text-gray-900 font-semibold mb-2">{message}</p>
        <p className="text-gray-600 text-sm">
          Silakan coba lagi atau refresh halaman
        </p>
      </div>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </div>
  )
}

export default ErrorMessage

