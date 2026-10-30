import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { getProductById, getProductReviews } from '../services/products'
import ShopNavigation from '../components/navigation/ShopNavigation'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import { useDataFetching } from '../hooks'
import { formatCurrency } from '../utils/format'
import { formatImageUrl, handleImageError } from '../utils/imageUtils'

/**
 * Product Detail Page - Elegant design inspired by Nike
 */
function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [variantError, setVariantError] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    details: false,
    delivery: false,
    reviews: false,
  })

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
      setVariantError(null)
    },
  })

  // Extract product from response
  const product = useMemo(() => {
    if (!productData) return null
    return productData.product || productData
  }, [productData])

  // Compute all available images for slide carousel
  const galleryImages = useMemo(() => {
    if (!product) return []
    const rawImgs = []
    if (Array.isArray(product.images) && product.images.length > 0) {
      rawImgs.push(...product.images.filter(Boolean))
    } else if (product.imageUrl || product.image) {
      rawImgs.push(product.imageUrl || product.image)
    }
    // If selected variant has a specific image, place it at the front
    if (selectedVariant?.image && !rawImgs.includes(selectedVariant.image)) {
      rawImgs.unshift(selectedVariant.image)
    }
    const formatted = rawImgs.map(img => formatImageUrl(img))
    return formatted.length > 0 ? formatted : ['/placeholder.jpg']
  }, [product, selectedVariant])

  // Reset active image index when product or variant changes
  useEffect(() => {
    setActiveImageIndex(0)
  }, [product?.id, selectedVariant?.id])

  const handlePrevImage = useCallback(() => {
    setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }, [galleryImages.length])

  const handleNextImage = useCallback(() => {
    setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }, [galleryImages.length])

  const handleTouchStart = e => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = e => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (diff > 40) {
      handleNextImage()
    } else if (diff < -40) {
      handlePrevImage()
    }
    setTouchStartX(null)
  }

  // Select initial in-stock variant when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const inStock = product.variants.find(v => Number(v.stock) > 0) || product.variants[0]
      setSelectedVariant(inStock)
      setVariantError(null)
    } else {
      setSelectedVariant(null)
    }
  }, [product])

  // Effective price and stock based on variant selection
  const effectivePrice = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.price)
    return Number(product?.price || 0)
  }, [selectedVariant, product?.price])

  const effectiveStock = useMemo(() => {
    if (selectedVariant) return Number(selectedVariant.stock)
    return Number(product?.stock || 0)
  }, [selectedVariant, product?.stock])

  // Prepare cart product data
  const cartProduct = useMemo(() => {
    if (!product) return null
    return {
      id: product.id,
      name: product.name,
      price: effectivePrice,
      image: formatImageUrl(selectedVariant?.image || product.imageUrl || product.image || '/placeholder.jpg'),
      stock: effectiveStock,
      variantId: selectedVariant ? selectedVariant.id : null,
      variantName: selectedVariant ? selectedVariant.name : null,
    }
  }, [product, selectedVariant, effectivePrice, effectiveStock])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      setVariantError('Silakan pilih salah satu varian produk terlebih dahulu')
      return
    }
    if (!cartProduct || effectiveStock <= 0) return

    addItem(cartProduct, quantity)
    navigate('/shop/cart')
  }, [product, selectedVariant, cartProduct, effectiveStock, quantity, addItem, navigate])

  const handleBuyNow = useCallback(() => {
    if (!product) return
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      setVariantError('Silakan pilih salah satu varian produk terlebih dahulu')
      return
    }
    if (!cartProduct || effectiveStock <= 0) return

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
  }, [product, selectedVariant, cartProduct, effectiveStock, quantity, addItem, navigate, isAuthenticated])

  const handleQuantityChange = useCallback(
    delta => {
      setQuantity(prev => Math.max(1, Math.min(effectiveStock || 1, prev + delta)))
    },
    [effectiveStock]
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
              {/* Product Image Gallery Slider */}
              <div className="flex flex-col space-y-3">
                {/* Main Slider Viewport */}
                <div
                  className="relative w-full aspect-square max-h-[500px] bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center group select-none"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Sliding Container */}
                  <div
                    className="flex w-full h-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                  >
                    {galleryImages.map((imgSrc, idx) => (
                      <div
                        key={`${imgSrc}-${idx}`}
                        className="w-full h-full flex-shrink-0 flex items-center justify-center p-4 bg-white"
                      >
                        <img
                          src={imgSrc}
                          alt={`${product?.name || 'Product'} ${idx + 1}`}
                          className="max-w-full max-h-[460px] w-auto h-auto object-contain pointer-events-none"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                          onError={e => handleImageError(e, product)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Navigation Arrows (if > 1 image) */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        aria-label="Foto sebelumnya"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextImage}
                        aria-label="Foto selanjutnya"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Image Counter Badge */}
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
                        {activeImageIndex + 1} / {galleryImages.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Horizontal Thumbnails Strip (if > 1 image) */}
                {galleryImages.length > 1 && (
                  <div className="flex items-center space-x-2.5 overflow-x-auto py-1 scrollbar-thin">
                    {galleryImages.map((imgSrc, idx) => (
                      <button
                        key={`thumb-${imgSrc}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 bg-white transition-all ${
                          activeImageIndex === idx
                            ? 'border-primary-600 ring-2 ring-primary-500/20 scale-105 shadow-sm'
                            : 'border-gray-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgSrc}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={e => handleImageError(e, product)}
                        />
                      </button>
                    ))}
                  </div>
                )}
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

                {/* Price - Dynamic based on selected variant */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl md:text-3xl font-heading font-bold text-gray-950">
                    {formatCurrency(effectivePrice)}
                  </span>
                  {selectedVariant && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                      {selectedVariant.name}
                    </span>
                  )}
                </div>

                {/* SHOPEE / TOKOPEDIA STYLE: Pilihan Varian Produk */}
                {product?.variants && product.variants.length > 0 && (
                  <div className="mb-5 p-4 rounded-xl bg-gray-50/80 border border-gray-200/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-heading font-bold text-gray-900 uppercase tracking-wider">
                        Pilihan Varian / Ukuran:
                      </span>
                      {selectedVariant && (
                        <span className="text-xs text-primary-600 font-medium">
                          Dipilih: <strong>{selectedVariant.name}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {product.variants.map(variant => {
                        const isSelected = selectedVariant?.id === variant.id
                        const isOutOfStock = Number(variant.stock) <= 0

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariant(variant)
                              setVariantError(null)
                              setQuantity(1)
                            }}
                            disabled={isOutOfStock}
                            className={`group relative px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 border flex flex-col items-center min-w-[76px] ${
                              isSelected
                                ? 'border-primary-600 bg-white text-primary-900 shadow-sm ring-2 ring-primary-500/30'
                                : isOutOfStock
                                ? 'border-gray-200 bg-gray-100/70 text-gray-400 cursor-not-allowed line-through'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <span className="font-semibold text-gray-900">{variant.name}</span>
                            <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-primary-700 font-bold' : 'text-gray-500'}`}>
                              {formatCurrency(Number(variant.price))}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-600 rounded-full ring-2 ring-white" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {variantError && (
                      <p className="mt-2.5 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                        ⚠️ {variantError}
                      </p>
                    )}
                  </div>
                )}

                {/* Product Specifications */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <ul className="space-y-1.5 text-xs font-body text-gray-600">
                    {product?.category && (
                      <li>
                        <span className="font-medium">Kategori:</span> {product.category.name}
                      </li>
                    )}
                    <li>
                      <span className="font-medium">SKU:</span>{' '}
                      {selectedVariant?.sku || product?.id?.slice(0, 8).toUpperCase() || '-'}
                    </li>
                    <li>
                      <span className="font-medium">Asal:</span> Indonesia
                    </li>
                  </ul>
                </div>

                {/* Stock Info */}
                <div className="mb-4">
                  <p className="text-xs font-body text-gray-600">
                    {effectiveStock > 0 ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                        <span className="text-primary-600 font-medium">Tersedia</span>
                        <span className="text-gray-500 ml-1.5">
                          ({effectiveStock} stok {selectedVariant ? 'varian ini' : 'tersedia'})
                        </span>
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">
                        {selectedVariant ? `Stok Varian "${selectedVariant.name}" Habis` : 'Stok Habis'}
                      </span>
                    )}
                  </p>
                </div>

                {/* Quantity Selector */}
                {effectiveStock > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-body font-medium text-gray-900 mb-1.5 uppercase tracking-wider">
                      Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                      >
                        <Icon name="ChevronDown" size={14} className="rotate-90" />
                      </button>
                      <span className="w-12 text-center text-xs font-body font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= effectiveStock}
                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
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
                      disabled={effectiveStock <= 0}
                      className="uppercase tracking-wider text-sm py-2 px-6"
                    >
                      {effectiveStock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                      onClick={handleBuyNow}
                      disabled={effectiveStock <= 0}
                      className="uppercase tracking-wider text-sm py-2 px-6"
                    >
                      {effectiveStock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
                    </Button>
                  </div>
                  
                  {/* Description below button */}
                  {product?.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-heading font-medium text-black leading-relaxed text-justify">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Collapsible Sections */}
                <div className="space-y-0 border-t border-gray-200 pt-4">
                  {/* Detail Produk Collapsible Accordion */}
                  <div className="border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => toggleSection('details')}
                      className="w-full flex items-center justify-between py-3 text-left hover:text-black transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-heading font-medium text-black">
                        Detail Produk
                      </span>
                      <Icon
                        name="ChevronDown"
                        size={16}
                        className={`text-gray-600 transition-transform ${
                          expandedSections.details ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.details && (
                      <div className="pb-4 space-y-2.5 text-xs font-body text-gray-600">
                        <div>
                          <span className="font-medium text-gray-900">Kategori:</span>{' '}
                          {product?.category?.name || '-'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">SKU:</span>{' '}
                          {product?.id?.slice(0, 8).toUpperCase() || '-'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Stok:</span>{' '}
                          {effectiveStock} unit {selectedVariant ? `(Varian: ${selectedVariant.name})` : ''}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Berat Produk:</span>{' '}
                          {product?.weight || 1000} gram
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Asal:</span> Indonesia
                        </div>
                        {product?.description && (
                          <div className="pt-2 mt-2 border-t border-gray-100">
                            <span className="font-medium text-gray-900 block mb-1">Rincian Lengkap:</span>
                            <p className="text-gray-600 leading-relaxed text-justify">
                              {product.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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


          </>
        )}
      </main>
    </div>
  )
}

export default ProductDetailPage
