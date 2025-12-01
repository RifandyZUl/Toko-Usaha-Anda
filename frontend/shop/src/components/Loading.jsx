import Icon from '@shared/components/Icon.jsx'

/**
 * Loading Component
 */
function Loading({ message = 'Memuat...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="animate-spin">
        <Icon name="Loader2" size={48} className="text-primary-600" />
      </div>
      {message && (
        <p className="text-gray-600 font-medium">{message}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

export default Loading

