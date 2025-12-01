import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { getProducts, getCategories } from '../services/products'
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

/**
 * Shop Page - Toko Usaha Anda E-Commerce
 */
function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addItem } = useCartStore()

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const result = await getCategories()
      if (result.success) {
        setCategories([
          { id: 'all', name: 'All Products', slug: 'all' },
          ...result.categories,
        ])
      }
    }
    fetchCategories()
  }, [])

  // Fetch products when category changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      const params = {
        page: 1,
        limit: 100,
      }

      if (selectedCategory !== 'all') {
        const category = categories.find(cat => cat.id === selectedCategory)
        if (category?.slug) {
          params.category = category.slug
        }
      }

      const result = await getProducts(params)

      if (result.success) {
        setProducts(result.products || [])
      } else {
        setError(result.error || 'Gagal memuat produk')
      }

      setLoading(false)
    }

    fetchProducts()
  }, [selectedCategory, categories])

  const handleAddToCart = product => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || product.image || '/placeholder.jpg',
      stock: product.stock || 0,
    }
    addItem(cartProduct, 1)
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      {/* Hero Section - Brand Identity */}
      <section className="relative bg-white py-16 border-b border-gray-300 overflow-hidden">
        {/* Signature Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-gray-900 mb-6 tracking-tight">
              Solusi Lengkap untuk Kebutuhan Sehari-hari
            </h1>
            <p className="text-base md:text-lg font-body text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
              Peralatan rumah tangga, perkakas tukang, dan aksesoris motor berkualitas dengan harga terjangkau. 
              <span className="block mt-2 text-gray-700 font-medium">
                Kualitas Terjamin • Harga Terjangkau • Layanan Ramah
              </span>
            </p>
            
            {/* Brand Values */}
            <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-primary-600 text-lg">✓</span>
                <span className="text-xs font-body text-gray-600 uppercase tracking-wider">Kualitas Terjamin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary-600 text-lg">✓</span>
                <span className="text-xs font-body text-gray-600 uppercase tracking-wider">Harga Terjangkau</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary-600 text-lg">✓</span>
                <span className="text-xs font-body text-gray-600 uppercase tracking-wider">Layanan Ramah</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container-custom py-12">
        {/* Category Filter - Clean & Minimal */}
        {categories.length > 0 && (
          <div className="mb-10 pb-6 border-b border-gray-300">
            <div className="flex flex-wrap gap-4 justify-center">
              {categories.map(category => {
                const isActive = selectedCategory === (category.id || category.slug)
                return (
                  <button
                    key={category.id || category.slug}
                    onClick={() => setSelectedCategory(category.id || category.slug)}
                    className={`text-xs font-body uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'text-primary-600 font-medium border-b-2 border-primary-600 pb-1'
                        : 'text-gray-500 hover:text-primary-600'
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
        {loading && <Loading message="Loading products..." />}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              setSelectedCategory('all')
              setError(null)
            }}
          />
        )}

        {/* Products Grid - Elegant Layout */}
        {!loading && !error && (
          <>
            {products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map(product => (
                  <div
                    key={product.id}
                    className="product-card group flex flex-col"
                  >
                    {/* Product Image */}
                    <Link
                      to={`/shop/product/${product.id}`}
                      className="relative block overflow-hidden bg-gray-50 border border-gray-200 transition-all duration-300 group-hover:border-primary-300"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={
                            product.imageUrl ||
                            product.image ||
                            '/placeholder.jpg'
                          }
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={e => {
                            e.target.src = '/placeholder.jpg'
                          }}
                        />
                        
                        {/* Quick View Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/5">
                          <Link
                            to={`/shop/product/${product.id}`}
                            className="bg-white px-6 py-2.5 uppercase text-xs font-medium tracking-wider text-gray-900 hover:bg-primary-600 hover:text-white transition-colors"
                          >
                            Quick View
                          </Link>
                        </div>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col pt-4">
                      {/* Category */}
                      {product.category && (
                        <p className="text-xs font-body text-gray-500 uppercase tracking-wider mb-1.5">
                          {product.category.name}
                        </p>
                      )}
                      
                      {/* Product Name */}
                      <Link
                        to={`/shop/product/${product.id}`}
                        className="mb-2 group-hover:text-primary-600 transition-colors"
                      >
                        <h3 className="text-sm font-heading font-medium text-gray-900 leading-snug line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price - Clear & Readable */}
                      <div className="mt-auto pt-3 border-t border-gray-200 group-hover:border-primary-200 transition-colors">
                        <p className="text-sm font-heading font-semibold text-gray-900">
                          Rp {product.price?.toLocaleString('id-ID') || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {products.length === 0 && !loading && (
              <div className="text-center py-20">
                <p className="text-lg font-body text-gray-500">
                  No products found in this category.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer - Brand Identity */}
      <footer className="relative bg-white border-t border-gray-300 py-8 mt-20">
        {/* Signature Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-2">
              <h3 className="text-sm font-heading font-medium mb-2 text-gray-900">
                TOKO USAHA ANDA
              </h3>
              <p className="text-xs font-body text-gray-600 leading-relaxed max-w-md">
                Solusi lengkap untuk kebutuhan sehari-hari Anda. Peralatan rumah tangga, perkakas tukang, dan aksesoris motor berkualitas dengan harga terjangkau.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-body font-medium uppercase tracking-wider mb-2 text-gray-900">
                Quick Links
              </h4>
              <ul className="space-y-1.5">
                <li>
                  <Link to="/shop" className="text-xs font-body text-gray-600 hover:text-primary-600 transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/shop/cart" className="text-xs font-body text-gray-600 hover:text-primary-600 transition-colors">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-xs font-body text-gray-600 hover:text-primary-600 transition-colors">
                    Home
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-body font-medium uppercase tracking-wider mb-2 text-gray-900">
                Contact
              </h4>
              <p className="text-xs font-body text-gray-600">
                Email: info@tokousahaanda.com
              </p>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-4 text-center">
            <p className="text-xs font-body text-gray-500 uppercase tracking-wider">
              © 2024 Toko Usaha Anda. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}


export default ShopPage
