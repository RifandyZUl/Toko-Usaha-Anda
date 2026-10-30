import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/format'
import { getProductImageUrl, handleImageError } from '../../utils/imageUtils'

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
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          onError={e => handleImageError(e, product)}
        />
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
