import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/format'
import { getProductImageUrl, handleImageError } from '../utils/imageUtils'
import Icon from '@shared/components/Icon.jsx'

/**
 * Modern Premium Product Card Component
 * Optimized for rich aesthetics, variant indicators, and smooth interactions
 */
function ProductCard({ product }) {
  const imageUrl = getProductImageUrl(product)
  const variants = product.variants || []
  const hasVariants = variants.length > 1
  
  // Calculate lowest price from variants if available
  const displayPrice = hasVariants
    ? Math.min(...variants.map(v => Number(v.price)))
    : Number(product.price)

  return (
    <div className="product-card group flex flex-col bg-white rounded-2xl border border-gray-100/90 overflow-hidden shadow-2xs hover:shadow-lg hover:border-primary-200/80 transition-all duration-300">
      {/* Product Image Box */}
      <Link
        to={`/shop/product/${product.id}`}
        className="relative block overflow-hidden bg-gray-50 aspect-square"
        aria-label={`Lihat detail ${product.name}`}
      >
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          loading="lazy"
          onError={(e) => handleImageError(e, product)}
        />

        {/* Floating Variant Badge */}
        {hasVariants && (
          <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold text-gray-800 shadow-xs border border-gray-200/70 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
            <span>{variants.length} Varian</span>
          </div>
        )}

        {/* Quick View Hover Overlay Button */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 hidden sm:block">
          <div className="bg-white/95 backdrop-blur-xs hover:bg-primary-600 hover:text-white text-gray-900 text-xs font-body font-medium py-2 px-3 rounded-xl text-center shadow-md border border-gray-200/60 transition-colors flex items-center justify-center gap-1.5">
            <span>{hasVariants ? 'Pilih Varian' : 'Lihat Produk'}</span>
            <Icon name="ArrowRight" size={13} />
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag */}
          {product.category && (
            <p className="text-[11px] font-body font-medium text-primary-600 uppercase tracking-wider mb-1">
              {product.category.name}
            </p>
          )}

          {/* Product Title */}
          <Link
            to={`/shop/product/${product.id}`}
            className="block mb-2 group-hover:text-primary-600 transition-colors"
          >
            <h3 className="text-xs sm:text-sm font-heading font-medium text-gray-900 leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price Information */}
        <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between gap-1">
          <div>
            {hasVariants && (
              <span className="block text-[10px] text-gray-400 font-body uppercase tracking-wider">
                Mulai dari
              </span>
            )}
            <p className="text-sm sm:text-base font-heading font-bold text-gray-900">
              {formatCurrency(displayPrice)}
            </p>
          </div>

          {/* Stock hint */}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-[10px] font-body text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              Sisa {product.stock}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
