import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { getProductById, getProductReviews } from '../services/products'
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import { formatCurrency } from '../utils/format'
import { useDataFetching } from '../hooks'
import { logDebug, logError } from '../utils/logger'

/**
 * Product Detail Page - Elegant design inspired by Nike
 */
function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [quantity, setQuantity] = useState(1)
  const [expandedSections, setExpandedSections] = useState({
    delivery: false,
    reviews: false,
  })
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false)

  // Fetch product using useDataFetching hook
  const fetchProductById = useCallback(
    async () => {
      if (!id) {
        throw new Error('Product ID tidak valid')
      }
      return getProductById(id)
    },
    [id]
  )

  const {
    data: productData,
    loading,
    error,
    fetchData: fetchProduct,
  } = useDataFetching(fetchProductById, {
    autoFetch: true,
    onSuccess: () => {
      setQuantity(1)
    },
  })

  // Extract product from response
  const product = useMemo(() => {
    if (!productData) return null
    return productData.product || productData
  }, [productData])

  // Prepare cart product data
  const cartProduct = useMemo(() => {
    if (!product) return null
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || product.image || '/placeholder.jpg',
      stock: product.stock || 0,
    }
  }, [product])

  const handleAddToCart = useCallback(() => {
    if (!cartProduct) return
    addItem(cartProduct, quantity)
    navigate('/shop/cart')
  }, [cartProduct, quantity, addItem, navigate])

  const handleBuyNow = useCallback(() => {
    if (!cartProduct) return

    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/shop/login', { 
        state: { from: { pathname: `/shop/product/${product?.id}` } } 
      })
      return
    }

    // Add to cart and go to checkout
    addItem(cartProduct, quantity)
    navigate('/shop/checkout')
  }, [cartProduct, quantity, addItem, navigate, isAuthenticated, product?.id])

  const handleQuantityChange = useCallback(
    delta => {
      if (!product) return
      setQuantity(prev => Math.max(1, Math.min(product.stock || 0, prev + delta)))
    },
    [product]
  )

  const toggleSection = useCallback(section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  const [productReviews, setProductReviews] = useState([])

  // Fetch verified reviews for this product
  useEffect(() => {
    if (!product?.id) return
    let isMounted = true
    getProductReviews(product.id).then(res => {
      if (isMounted && res.success && res.reviews) {
        setProductReviews(res.reviews)
      }
    })
    return () => {
      isMounted = false
    }
  }, [product?.id])

  const averageRating = useMemo(() => {
    if (productReviews.length === 0) return 0
    const total = productReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0)
    return total / productReviews.length
  }, [productReviews])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && showProductDetailsModal) {
        setShowProductDetailsModal(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showProductDetailsModal])

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      <main className="container-custom py-6">
        {loading && <Loading message="Loading product..." />}

        {error && !loading && (
          <ErrorMessage
            message={error}
            onRetry={() => {
              fetchProduct()
            }}
          />
        )}

        {product && !loading && !error && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 mb-6">
              {/* Product Image */}
              <div className="overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                <img
                  src={product?.imageUrl || product?.image || '/placeholder.jpg'}
                  alt={product?.name || 'Product'}
                  className="max-w-full max-h-[500px] w-auto h-auto object-contain"
                  crossOrigin="anonymous"
                  loading="lazy"
                  onError={e => {
                    const attemptedSrc = e.target.src
                    logError('Product detail - Image load error', {
                      productId: product?.id,
                      imageUrl: product?.imageUrl,
                      image: product?.image,
                      attemptedSrc,
                    })
                    if (!attemptedSrc.includes('placeholder')) {
                      e.target.src = '/placeholder.jpg'
                    }
                  }}
                  onLoad={() => {
                    logDebug('Product detail - Image loaded successfully', product?.id)
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                {/* Category */}
                {product?.category && (
                  <p className="text-xs font-body text-gray-500 uppercase tracking-wider mb-2">
                    {product.category.name}
                  </p>
                )}

                {/* Product Name */}
                <h1 className="text-2xl md:text-3xl font-heading font-medium text-black mb-3 tracking-tight leading-tight">
                  {product?.name || 'Product Name'}
                </h1>

                {/* Price - Clear & Readable */}
                <p className="text-lg font-heading font-medium text-gray-900 mb-4">
                  {formatCurrency(Number(product?.price || 0))}
                </p>

                {/* Product Specifications */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <ul className="space-y-1.5 text-xs font-body text-gray-600">
                    {product?.category && (
                      <li>
                        <span className="font-medium">Kategori:</span> {product.category.name}
                      </li>
                    )}
                    <li>
                      <span className="font-medium">SKU:</span> {product?.id?.slice(0, 8).toUpperCase() || '-'}
                    </li>
                    <li>
                      <span className="font-medium">Asal:</span> Indonesia
                    </li>
                  </ul>
                </div>

                {/* Stock Info */}
                <div className="mb-4">
                  <p className="text-xs font-body text-gray-600">
                    {(product?.stock || 0) > 0 ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                        <span className="text-primary-600 font-medium">Tersedia</span>
                        <span className="text-gray-500 ml-1.5">({product.stock} stok tersedia)</span>
                      </span>
                    ) : (
                      <span className="text-red-500">Stok Habis</span>
                    )}
                  </p>
                </div>

                {/* Quantity Selector */}
                {(product?.stock || 0) > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-body font-medium text-gray-900 mb-1.5 uppercase tracking-wider">
                      Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Icon name="ChevronDown" size={14} className="rotate-90" />
                      </button>
                      <span className="w-12 text-center text-xs font-body font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= (product?.stock || 0)}
                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Icon name="ChevronDown" size={14} className="-rotate-90" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Add to Cart and Buy Now Buttons */}
                <div className="mb-3">
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth={false}
                      onClick={handleAddToCart}
                      disabled={!(product?.stock) || product.stock === 0}
                      className="uppercase tracking-wider text-sm py-2 px-6"
                    >
                      {(product?.stock || 0) > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                      onClick={handleBuyNow}
                      disabled={!(product?.stock) || product.stock === 0}
                      className="uppercase tracking-wider text-sm py-2 px-6"
                    >
                      {(product?.stock || 0) > 0 ? 'Beli Sekarang' : 'Stok Habis'}
                    </Button>
                  </div>
                  
                  {/* Description below button */}
                  {product?.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-heading font-medium text-black leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-0 border-t border-gray-200 pt-4">
                  {/* View Product Details */}
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => setShowProductDetailsModal(true)}
                      className="w-full flex items-center justify-between py-3 text-left hover:text-black transition-colors"
                    >
                      <span className="text-sm font-heading font-medium text-black underline">
                        View Product Details
                      </span>
                    </button>
                  </div>

                  {/* Free Delivery and Returns */}
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleSection('delivery')}
                      className="w-full flex items-center justify-between py-3 text-left hover:text-black transition-colors"
                    >
                      <span className="text-sm font-heading font-medium text-black">
                        Gratis Ongkir dan Retur
                      </span>
                      <Icon
                        name="ChevronDown"
                        size={16}
                        className={`text-gray-600 transition-transform ${
                          expandedSections.delivery ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.delivery && (
                      <div className="pb-4 space-y-2 text-xs font-body text-gray-600">
                        <div>
                          <span className="font-medium">Gratis Ongkir:</span> Untuk pembelian di atas Rp 100.000
                        </div>
                        <div>
                          <span className="font-medium">Pengiriman:</span> 2-5 hari kerja
                        </div>
                        <div>
                          <span className="font-medium">Retur:</span> Bebas retur dalam 7 hari setelah barang diterima
                        </div>
                        <div>
                          <span className="font-medium">Garansi:</span> 1 tahun untuk produk elektronik
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reviews */}
                  <div>
                    <button
                      onClick={() => toggleSection('reviews')}
                      className="w-full flex items-center justify-between py-3 text-left hover:text-black transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-heading font-medium text-black">
                          Reviews ({productReviews.length})
                        </span>
                        {productReviews.length > 0 && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-xs ${
                                  i < Math.round(averageRating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                              ({averageRating.toFixed(1)})
                            </span>
                          </div>
                        )}
                      </div>
                      <Icon
                        name="ChevronDown"
                        size={16}
                        className={`text-gray-600 transition-transform ${
                          expandedSections.reviews ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.reviews && (
                      <div className="pb-4 space-y-4">
                        {productReviews.length > 0 ? (
                          productReviews.map(review => (
                            <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-900">
                                    {review.user}
                                  </span>
                                  <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                    Terverifikasi
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-xs ${
                                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{review.comment}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(review.date).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">Belum ada review untuk produk ini. Ulasan akan muncul setelah pembeli menyelesaikan pesanan.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Link */}
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-heading font-medium text-black hover:text-primary-600 uppercase tracking-wider transition-colors"
                >
                  <Icon name="ChevronDown" size={14} className="rotate-90" />
                  Lanjutkan Belanja
                </Link>
              </div>
            </div>

            {/* Product Details Modal */}
            {showProductDetailsModal && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowProductDetailsModal(false)}
              >
                <div
                  className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-heading font-medium text-gray-900">
                      Product Details
                    </h2>
                    <button
                      onClick={() => setShowProductDetailsModal(false)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Icon name="X" size={20} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Product Image */}
                      <div className="overflow-hidden bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
                        <img
                          src={product?.imageUrl || product?.image || '/placeholder.jpg'}
                          alt={product?.name || 'Product'}
                          className="max-w-full max-h-[300px] w-auto h-auto object-contain"
                          loading="lazy"
                          onError={e => {
                            if (!e.target.src.includes('placeholder')) {
                              e.target.src = '/placeholder.jpg'
                            }
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div>
                        <h3 className="text-xl font-heading font-medium text-gray-900 mb-2">
                          {product?.name || 'Product Name'}
                        </h3>
                        <p className="text-lg font-heading font-medium text-gray-900 mb-4">
                          {formatCurrency(Number(product?.price || 0))}
                        </p>
                        {product?.description && (
                          <p className="text-sm font-body text-gray-600 leading-relaxed mb-4">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-heading font-medium text-gray-900 mb-3">
                        Product Details
                      </h4>
                      <ul className="space-y-2 text-sm font-body text-gray-600">
                        {product?.category && (
                          <li>
                            <span className="font-medium">Kategori:</span> {product.category.name}
                          </li>
                        )}
                        <li>
                          <span className="font-medium">SKU:</span> {product?.id?.slice(0, 8).toUpperCase() || '-'}
                        </li>
                        <li>
                          <span className="font-medium">Stok:</span> {product?.stock || 0} unit
                        </li>
                        <li>
                          <span className="font-medium">Asal:</span> Indonesia
                        </li>
                        {product?.description && (
                          <li>
                            <span className="font-medium">Deskripsi:</span>
                            <p className="mt-1 text-gray-600">{product.description}</p>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ProductDetailPage
