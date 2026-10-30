import { useState, useRef, useEffect } from 'react'
import Icon from '@shared/components/Icon.jsx'
import ProductCard from './ProductCard'

/**
 * Product Slider Component
 * Modern carousel with navigation for displaying products
 */
function ProductSlider({ 
  products = [], 
  title = 'Produk Terlaris',
  subtitle,
  itemsPerSlide = 4,
  showNavigation = true,
  className = ''
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const sliderRef = useRef(null)

  const totalSlides = Math.ceil(products.length / itemsPerSlide)
  const canGoNext = currentIndex < totalSlides - 1
  const canGoPrev = currentIndex > 0

  useEffect(() => {
    setCurrentIndex(0)
  }, [products.length])

  const goToSlide = (index) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index)
    }
  }

  const goNext = () => {
    if (canGoNext) {
      goToSlide(currentIndex + 1)
    }
  }

  const goPrev = () => {
    if (canGoPrev) {
      goToSlide(currentIndex - 1)
    }
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.pageX - sliderRef.current.offsetLeft)
    setScrollLeft(sliderRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - sliderRef.current.offsetLeft
    const walk = (x - startX) * 2
    sliderRef.current.scrollLeft = scrollLeft - walk
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className={`product-slider ${className}`}>
      {/* Header with Title and Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full uppercase tracking-wider">
                {subtitle}
              </span>
            )}
          </div>
          {products.length > itemsPerSlide && (
            <p className="text-sm text-gray-500">
              {products.length} produk tersedia
            </p>
          )}
        </div>

        {/* Navigation Buttons */}
        {showNavigation && totalSlides > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={!canGoPrev}
              className={`p-2 rounded-full border transition-all duration-200 ${
                canGoPrev
                  ? 'border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Previous slide"
            >
              <Icon name="ChevronLeft" size={20} />
            </button>
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className={`p-2 rounded-full border transition-all duration-200 ${
                canGoNext
                  ? 'border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Next slide"
            >
              <Icon name="ChevronRight" size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Slider Container */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {Array.from({ length: totalSlides }).map((_, slideIndex) => {
              const slideProducts = products.slice(
                slideIndex * itemsPerSlide,
                slideIndex * itemsPerSlide + itemsPerSlide
              )
              
              return (
                <div
                  key={slideIndex}
                  className="min-w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {slideProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Slide Indicators */}
        {totalSlides > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-primary-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductSlider
