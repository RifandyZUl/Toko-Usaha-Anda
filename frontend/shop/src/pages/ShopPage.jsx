import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts, getCategories } from '../services/products'
import ShopNavigation from '../components/ShopNavigation'
import ErrorMessage from '../components/ErrorMessage'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import EmptyState from '../components/EmptyState'
import BackToTop from '../components/BackToTop'
import { scrollToProducts } from '../utils/scrollUtils'
import { handleImageError } from '../utils/imageUtils'
import { useDataFetching } from '../hooks'
import { logDebug } from '../utils/logger'

/**
 * Shop Page - Toko Usaha Anda E-Commerce
 */
function ShopPage() {
  const [searchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch categories
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
    fetchData: fetchCategoriesData,
  } = useDataFetching(getCategories, {
    autoFetch: true,
  })

  // Process categories with 'all' option
  const categories = useMemo(() => {
    if (!categoriesData) {
      logDebug('ShopPage - No categoriesData', null)
      return []
    }
    const cats = Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []
    const result = [{ id: 'all', name: 'All Products', slug: 'all' }, ...cats]
    logDebug('ShopPage - Categories processed', { count: result.length })
    return result
  }, [categoriesData])

  // Fetch products - using direct state management for better control
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState(null)

  // Fetch products when category or categories change
  useEffect(() => {
    // Don't fetch if categories are still loading
    if (categoriesLoading) {
      logDebug('ShopPage - Categories still loading, waiting...', null)
      return
    }

    const fetchProducts = async () => {
      setProductsLoading(true)
      setProductsError(null)

      try {
        const params = {
          page: 1,
          limit: 100,
        }

        if (searchQuery.trim()) {
          params.search = searchQuery.trim()
        }

        // Only filter by category if we have categories and selectedCategory is not 'all'
        if (selectedCategory !== 'all' && categories.length > 0) {
          const category = categories.find(
            cat => cat.id === selectedCategory || cat.slug === selectedCategory
          )
          if (category?.slug) {
            params.category = category.slug
            logDebug('ShopPage - Filtering by category', { category: category.slug })
          }
        }

        logDebug('ShopPage - Fetching products', params)
        const result = await getProducts(params)
        logDebug('ShopPage - Products result', {
          success: result.success,
          productsCount: result.products?.length || 0,
          hasProducts: !!result.products,
        })

        if (result.success && result.products) {
          const productsArray = Array.isArray(result.products) ? result.products : []
          setProducts(productsArray)
          logDebug('ShopPage - Products set successfully', { count: productsArray.length })
        } else {
          logDebug('ShopPage - Products fetch failed', {
            success: result.success,
            error: result.error,
            hasProducts: !!result.products,
          })
          setProductsError(result.error || 'Gagal memuat produk')
          setProducts([])
        }
      } catch (err) {
        logDebug('ShopPage - Error fetching products', err)
        setProductsError('Gagal memuat produk. Pastikan backend server berjalan.')
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, categories.length, categoriesLoading, searchQuery])

  // Combine loading and error states
  const loading = categoriesLoading || productsLoading
  const error = categoriesError || productsError

  // Handle category selection with scroll
  const handleCategorySelect = useCallback(categoryId => {
    setSelectedCategory(categoryId)
    scrollToProducts()
  }, [])

  // Find category by keywords (for featured sections)
  const findCategoryByKeywords = useCallback(
    keywords => {
      if (!categories.length) return null

      // Convert keywords to array if string
      const searchTerms = Array.isArray(keywords) ? keywords : [keywords]

      // Find category that matches any of the keywords
      const found = categories.find(category => {
        const categoryName = (category.name || '').toLowerCase()
        const categorySlug = (category.slug || '').toLowerCase()

        return searchTerms.some(term => {
          const lowerTerm = term.toLowerCase()
          return categoryName.includes(lowerTerm) || categorySlug.includes(lowerTerm)
        })
      })

      return found ? found.id || found.slug : null
    },
    [categories]
  )

  // Handle featured section click
  const handleFeaturedClick = useCallback(
    (e, categoryKeywords) => {
      e.preventDefault()
      const categoryId = findCategoryByKeywords(categoryKeywords)
      if (categoryId) {
        handleCategorySelect(categoryId)
      } else {
        // Fallback to all if category not found
        handleCategorySelect('all')
      }
    },
    [findCategoryByKeywords, handleCategorySelect]
  )

  // Listen for category filter events from navbar
  useEffect(() => {
    const handleFilterCategory = event => {
      const { keywords } = event.detail
      if (keywords && keywords.includes('all')) {
        handleCategorySelect('all')
        return
      }
      const categoryId = findCategoryByKeywords(keywords)
      if (categoryId) {
        handleCategorySelect(categoryId)
      }
    }

    window.addEventListener('filterCategory', handleFilterCategory)
    return () => {
      window.removeEventListener('filterCategory', handleFilterCategory)
    }
  }, [findCategoryByKeywords, handleCategorySelect])

  // Apply category filter from URL search params or localStorage on mount/categories load
  useEffect(() => {
    if (categoriesData && categories.length > 0) {
      // 1. Check URL query param ?category=
      const categoryParam = searchParams.get('category')
      if (categoryParam) {
        const found = categories.find(
          cat =>
            cat.slug === categoryParam ||
            cat.id === categoryParam ||
            (cat.name && cat.name.toLowerCase().includes(categoryParam.toLowerCase()))
        )
        if (found) {
          handleCategorySelect(found.id || found.slug)
          return
        }
      }

      // 2. Check pending filter from localStorage
      const pendingFilter = localStorage.getItem('pendingCategoryFilter')
      if (pendingFilter) {
        try {
          const keywords = JSON.parse(pendingFilter)
          const categoryId = findCategoryByKeywords(keywords)
          if (categoryId) {
            handleCategorySelect(categoryId)
          }
        } catch (err) {
          console.error('Error parsing pending category filter:', err)
        } finally {
          localStorage.removeItem('pendingCategoryFilter')
        }
      }
    }
  }, [categoriesData, categories, searchParams, findCategoryByKeywords, handleCategorySelect])

  // Listen for search events from navbar
  useEffect(() => {
    const handleSearchProducts = event => {
      const { query } = event.detail
      setSearchQuery(query)
      setSelectedCategory('all')
      scrollToProducts()
    }

    window.addEventListener('searchProducts', handleSearchProducts)
    return () => {
      window.removeEventListener('searchProducts', handleSearchProducts)
    }
  }, [])

  // Apply pending search filter from localStorage on mount
  useEffect(() => {
    const pendingSearch = localStorage.getItem('pendingSearchFilter')
    if (pendingSearch) {
      setSearchQuery(pendingSearch)
      setSelectedCategory('all')
      localStorage.removeItem('pendingSearchFilter')
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      {/* Hero Section - Brand Identity */}
      <section className="relative bg-white py-10 border-b border-gray-300 overflow-hidden">
        {/* Signature Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-gray-900 mb-4 tracking-tight">
              Solusi Lengkap untuk Kebutuhan Rumah Tangga
            </h1>
            <p className="text-sm md:text-base font-body text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
              Kebutuhan rumah tangga, perkakas tukang, dan alat motor berkualitas dengan harga
              terjangkau.
              <span className="block mt-1.5 text-gray-700 font-medium text-xs">
                Kualitas Terjamin • Harga Terjangkau • Layanan Ramah
              </span>
            </p>

            {/* Brand Values */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-1.5">
                <span className="text-primary-600 text-sm">✓</span>
                <span className="text-xs font-body text-gray-600 uppercase tracking-wider">
                  Kualitas Terjamin
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary-600 text-sm">✓</span>
                <span className="text-xs font-body text-gray-600 uppercase tracking-wider">
                  Harga Terjangkau
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary-600 text-sm">✓</span>
                <span className="text-xs font-body text-gray-600 uppercase tracking-wider">
                  Layanan Ramah
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Label */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="container-custom">
          <h2 className="text-xl md:text-2xl font-heading font-medium text-gray-900 tracking-tight">
            Featured
          </h2>
        </div>
      </section>

      {/* Featured Section - Nike Style Split Screen */}
      <section className="bg-white">
        <div className="flex flex-col md:flex-row h-[600px] md:h-[700px]">
          {/* Left Section - Kebutuhan Rumah Tangga */}
          <Link
            to="/shop"
            onClick={e => handleFeaturedClick(e, ['kebutuhan rumah', 'rumah tangga', 'household'])}
            className="relative flex-1 h-[300px] md:h-full overflow-hidden group cursor-pointer bg-gray-100"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=800&fit=crop')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=800&fit=crop"
              alt="Kebutuhan Rumah Tangga"
              className="w-full h-full object-cover opacity-0"
              loading="lazy"
              onError={e =>
                handleImageError(
                  e,
                  null,
                  'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=800&fit=crop'
                )
              }
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h3 className="text-2xl md:text-3xl font-heading font-semibold text-white mb-2 drop-shadow-lg">
                Kebutuhan Rumah Tangga
              </h3>
              <p className="text-sm md:text-base font-body text-white/95 mb-4 drop-shadow-md">
                Kebutuhan rumah tangga lengkap dan berkualitas
              </p>
              <button className="bg-white text-gray-900 px-6 py-2.5 rounded-full text-sm font-body font-medium hover:bg-gray-100 transition-colors uppercase tracking-wider shadow-lg">
                Explore
              </button>
            </div>
          </Link>

          {/* Right Section - Perkakas Tukang & Alat Motor (Stacked) */}
          <div className="flex flex-col flex-1 h-[300px] md:h-full">
            {/* Top Right - Perkakas Tukang */}
            <Link
              to="/shop"
              onClick={e => handleFeaturedClick(e, ['perkakas', 'tools', 'tukang'])}
              className="relative flex-1 h-1/2 overflow-hidden group cursor-pointer bg-gray-100"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop"
                alt="Perkakas Tukang"
                className="w-full h-full object-cover opacity-0"
                loading="lazy"
                onError={e =>
                  handleImageError(
                    e,
                    null,
                    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop'
                  )
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-heading font-semibold text-white mb-2 drop-shadow-lg">
                  Perkakas Tukang
                </h3>
                <p className="text-xs md:text-sm font-body text-white/95 mb-4 drop-shadow-md">
                  Alat pertukangan berkualitas
                </p>
                <button className="bg-white text-gray-900 px-6 py-2.5 rounded-full text-sm font-body font-medium hover:bg-gray-100 transition-colors uppercase tracking-wider shadow-lg">
                  Shop
                </button>
              </div>
            </Link>

            {/* Bottom Right - Alat Alat Motor */}
            <Link
              to="/shop"
              onClick={e => handleFeaturedClick(e, ['motor', 'motorcycle', 'alat motor'])}
              className="relative flex-1 h-1/2 overflow-hidden group cursor-pointer border-t md:border-t-0 md:border-l border-gray-300 bg-gray-100"
              style={{
                backgroundImage: `url('https://blog.indoteknik.com/wp-content/uploads/2025/03/day-6-71.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <img
                src="https://blog.indoteknik.com/wp-content/uploads/2025/03/day-6-71.jpg"
                alt="Alat Alat Motor"
                className="w-full h-full object-cover opacity-0"
                loading="lazy"
                onError={e =>
                  handleImageError(
                    e,
                    null,
                    'https://images.unsplash.com/photo-1558980664-1db506751c6e?w=1200&h=800&fit=crop'
                  )
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-heading font-semibold text-white mb-2 drop-shadow-lg">
                  Alat Alat Motor
                </h3>
                <p className="text-xs md:text-sm font-body text-white/95 mb-4 drop-shadow-md">
                  Aksesoris dan peralatan motor
                </p>
                <button className="bg-white text-gray-900 px-6 py-2.5 rounded-full text-sm font-body font-medium hover:bg-gray-100 transition-colors uppercase tracking-wider shadow-lg">
                  Shop
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container-custom py-8 products-section">
        {/* Category Filter - Modern & Clean Pill Tabs */}
        {categories.length > 0 && (
          <div className="mb-8 pb-4">
            <div className="flex flex-wrap gap-2.5 justify-center items-center">
              {categories.map(category => {
                const isActive = selectedCategory === (category.id || category.slug)
                return (
                  <button
                    key={category.id || category.slug}
                    onClick={() => handleCategorySelect(category.id || category.slug)}
                    className={`px-4 py-2 rounded-full text-xs font-body tracking-wider uppercase transition-all duration-200 font-medium ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-md ring-2 ring-gray-900/10'
                        : 'bg-white text-gray-600 border border-gray-200/90 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}



        {/* Loading State */}
        {loading && <ProductGridSkeleton count={10} />}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              setSelectedCategory('all')
              setProductsError(null)
              // Re-fetch categories to reset error state
              if (categoriesError) {
                fetchCategoriesData()
              }
            }}
          />
        )}

        {/* Products Grid - Elegant Layout */}
        {!loading && !error && (
          <>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState message="Tidak ada produk ditemukan dalam kategori ini" />
            )}
          </>
        )}
      </main>

      {/* Footer - Brand Identity */}
      <footer className="relative bg-white border-t border-gray-300 py-6 mt-12">
        {/* Signature Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <h3 className="text-base font-heading font-medium mb-2 text-gray-900">
                TOKO USAHA ANDA
              </h3>
              <p className="text-sm font-body text-gray-600 leading-relaxed max-w-md">
                Solusi lengkap untuk kebutuhan rumah tangga Anda. Kebutuhan rumah tangga, perkakas
                tukang, dan aksesoris motor berkualitas dengan harga terjangkau.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-body font-medium uppercase tracking-wider mb-2 text-gray-900">
                Quick Links
              </h4>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    to="/shop"
                    className="text-sm font-body text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Shop
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shop/cart"
                    className="text-sm font-body text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Cart
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    className="text-sm font-body text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    Home
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-body font-medium uppercase tracking-wider mb-2 text-gray-900">
                Contact
              </h4>
              <p className="text-sm font-body text-gray-600">Email: info@tokousahaanda.com</p>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-4 text-center">
            <p className="text-sm font-body text-gray-500 uppercase tracking-wider">
              © 2024 Toko Usaha Anda. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  )
}

export default ShopPage
