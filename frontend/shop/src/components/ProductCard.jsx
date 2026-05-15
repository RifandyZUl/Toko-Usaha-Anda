import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/format'
import { getProductImageUrl, handleImageError } from '../utils/imageUtils'

/**
 * Product Card Component
 * Reusable product card with consistent styling and error handling
 */
function ProductCard({ product }) {
  const imageUrl = getProductImageUrl(product)

  return (
    <div className="product-card group flex flex-col">
      {/* Product Image */}
      <Link
        to={`/shop/product/${product.id}`}
        className="relative block overflow-hidden bg-gray-50 border border-gray-200 transition-all duration-300 group-hover:border-primary-300"
        aria-label={`View ${product.name}`}
      >
        <div className="aspect-square relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => handleImageError(e, product)}
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col pt-2">
        {/* Category */}
        {product.category && (
          <p className="text-xs font-body text-gray-500 uppercase tracking-wider mb-1">
            {product.category.name}
          </p>
        )}

        {/* Product Name */}
        <Link
          to={`/shop/product/${product.id}`}
          className="mb-1.5 group-hover:text-primary-600 transition-colors"
        >
          <h3 className="text-base font-heading font-medium text-gray-900 leading-snug line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price - Clear & Readable */}
        <div className="mt-auto pt-2 border-t border-gray-200 group-hover:border-primary-200 transition-colors">
          <p className="text-base font-heading font-semibold text-gray-900">
            {formatCurrency(Number(product.price))}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductCard

