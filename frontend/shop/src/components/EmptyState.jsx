import Icon from '@shared/components/Icon.jsx'

/**
 * Empty State Component
 * Shows when there are no products to display
 */
function EmptyState({ message = 'Tidak ada produk ditemukan', showIcon = true }) {
  return (
    <div className="text-center py-16 px-4">
      {showIcon && (
        <div className="mb-4 flex justify-center">
          <div className="bg-gray-100 rounded-full p-6">
            <Icon name="Package" size={48} className="text-gray-400" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-heading font-medium text-gray-900 mb-2">
        {message}
      </h3>
      <p className="text-sm font-body text-gray-500 max-w-md mx-auto">
        Coba pilih kategori lain atau kembali lagi nanti
      </p>
    </div>
  )
}

export default EmptyState

