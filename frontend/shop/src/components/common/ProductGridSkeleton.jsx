/**
 * Product Grid Skeleton Loading Component
 * Shows loading placeholders for product grid
 */
function ProductGridSkeleton({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="product-card flex flex-col animate-pulse">
          {/* Image Skeleton */}
          <div className="aspect-square bg-gray-200 border border-gray-200 rounded-sm"></div>

          {/* Info Skeleton */}
          <div className="flex-1 flex flex-col pt-2">
            <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
            <div className="mt-auto pt-2 border-t border-gray-200">
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductGridSkeleton
