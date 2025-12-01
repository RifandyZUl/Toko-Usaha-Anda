import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { getProductById } from '../services/products'
import ShopNavigation from '../components/ShopNavigation'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'

/**
 * Product Detail Page - Elegant design inspired by Arhaus
 */
function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)

  // Fetch product on mount
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID tidak valid')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const result = await getProductById(id)

      if (result.success && result.product) {
        setProduct(result.product)
        setQuantity(1)
      } else {
        setError(result.error || 'Produk tidak ditemukan')
      }

      setLoading(false)
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return

    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || product.image || '/placeholder.jpg',
      stock: product.stock || 0,
    }
    addItem(cartProduct, quantity)
    navigate('/shop/cart')
  }

  const handleQuantityChange = delta => {
    if (!product) return
    setQuantity(prev => Math.max(1, Math.min(product.stock || 0, prev + delta)))
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      <main className="container-custom py-12">
        {loading && <Loading message="Loading product..." />}

        {error && !loading && (
          <ErrorMessage
            message={error}
            onRetry={() => navigate('/shop')}
          />
        )}

        {product && !loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Product Image */}
            <div className="overflow-hidden bg-white border border-gray-200">
              <img
                src={product.imageUrl || product.image || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-auto object-cover"
                onError={e => {
                  e.target.src = '/placeholder.jpg'
                }}
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Category */}
              {product.category && (
                <p className="text-xs font-body text-gray-500 uppercase tracking-wider mb-4">
                  {product.category.name}
                </p>
              )}

              {/* Product Name */}
              <h1 className="text-3xl md:text-4xl font-heading font-light text-gray-900 mb-6 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Price - Clear & Readable */}
              <p className="text-2xl font-heading font-medium text-gray-900 mb-8">
                Rp {product.price?.toLocaleString('id-ID') || '0'}
              </p>

              {/* Description */}
              {product.description && (
                <div className="mb-8 pb-8 border-b border-gray-300">
                  <p className="text-sm font-body text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Stock Info */}
              <div className="mb-8">
                <p className="text-sm font-body text-gray-600">
                  {product.stock > 0 ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      <span className="text-primary-600 font-medium">Tersedia</span>
                      <span className="text-gray-500 ml-2">({product.stock} stok tersedia)</span>
                    </span>
                  ) : (
                    <span className="text-red-500">Stok Habis</span>
                  )}
                </p>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="mb-8">
                  <label className="block text-sm font-body font-medium text-gray-900 mb-3 uppercase tracking-wider">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Icon name="ChevronDown" size={18} className="rotate-90" />
                    </button>
                    <span className="w-16 text-center text-base font-body font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Icon name="ChevronDown" size={18} className="-rotate-90" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="mb-6">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={!product.stock || product.stock === 0}
                  className="uppercase tracking-wider"
                >
                  {product.stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
                </Button>
              </div>

              {/* Back Link */}
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-sm font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
              >
                <Icon name="ChevronDown" size={16} className="rotate-90" />
                Lanjutkan Belanja
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProductDetailPage
