import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import ShopNavigation from '../components/ShopNavigation'
import { formatCurrency } from '../utils/format'
import { logError, logInfo } from '../utils/logger'
import { getProductById } from '../services/products'

/**
 * Cart Page - Toko Usaha Anda E-Commerce
 */
function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalPrice,
  } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  
  const [productStocks, setProductStocks] = useState({})
  const [loadingStocks, setLoadingStocks] = useState(false)
  
  const handleCheckout = useCallback(() => {
    if (!isAuthenticated()) {
      navigate('/shop/login', { state: { from: { pathname: '/shop/checkout' } } })
      return
    }
    navigate('/shop/checkout')
  }, [isAuthenticated, navigate])

  // Fetch current stock for all cart items
  useEffect(() => {
    const fetchStocks = async () => {
      if (items.length === 0) {
        setProductStocks({})
        return
      }

      setLoadingStocks(true)
      const stockMap = {}

      try {
        const validItems = []
        
        await Promise.all(
          items.map(async item => {
            const itemKey = item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)
            try {
              const result = await getProductById(item.id)
              if (result.success && result.product) {
                if (item.variantId && result.product.variants) {
                  const variant = result.product.variants.find(v => v.id === item.variantId)
                  stockMap[itemKey] = variant ? Number(variant.stock) : 0
                } else {
                  stockMap[itemKey] = result.product.stock || 0
                }
                validItems.push(item)
              } else {
                logInfo(`Product ${item.id} not found, removing from cart`)
                removeItem(itemKey)
              }
            } catch (error) {
              logError(`Error fetching stock for product ${item.id}`, error)
              removeItem(itemKey)
            }
          })
        )
        setProductStocks(stockMap)
        
        // Auto-adjust quantities that exceed stock
        validItems.forEach(item => {
          const itemKey = item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)
          const currentStock = stockMap[itemKey] !== undefined 
            ? stockMap[itemKey] 
            : (item.stock || 0)
          if (item.quantity > currentStock && currentStock > 0) {
            updateQuantity(itemKey, currentStock)
          }
        })
      } catch (error) {
        logError('Error fetching product stocks', error)
      } finally {
        setLoadingStocks(false)
      }
    }

    fetchStocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const totalPrice = useMemo(() => getTotalPrice(), [getTotalPrice])
  const shippingFee = 15000
  const finalTotal = useMemo(() => totalPrice + shippingFee, [totalPrice])

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <div className="max-w-md mx-auto text-center">
            <Icon name="Package" size={64} className="mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-4">
              Keranjang Belanja Kosong
            </h2>
            <p className="text-sm font-body text-gray-600 mb-8">
              Mulai belanja untuk menambahkan produk ke keranjang
            </p>
            <Link to="/shop">
              <Button variant="primary" size="lg" className="uppercase tracking-wider">
                Mulai Belanja
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />
      
      <main className="container-custom py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-heading font-medium text-gray-900 mb-2 tracking-tight">
            Keranjang Belanja
          </h1>
          <p className="text-sm font-body text-gray-600">
            {items.length} {items.length === 1 ? 'produk' : 'produk'} dalam keranjang Anda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const itemKey = item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)
              const currentStock = productStocks[itemKey] !== undefined 
                ? productStocks[itemKey] 
                : (item.stock || 0)
              const isOutOfStock = currentStock === 0
              const isQuantityExceeded = item.quantity > currentStock
              const maxQuantity = Math.max(0, currentStock)

              return (
                <div
                  key={itemKey}
                  className="bg-white border-b border-gray-200 pb-4 flex gap-4"
                >
                  {/* Product Image */}
                  <Link
                    to={`/shop/product/${item.id}`}
                    className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 overflow-hidden bg-gray-50 rounded"
                  >
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={e => {
                        e.target.src = '/placeholder.jpg'
                      }}
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Link
                        to={`/shop/product/${item.id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        <h3 className="text-sm font-heading font-medium text-gray-900">
                          {item.name}
                        </h3>
                      </Link>
                      {item.variantName && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 shrink-0">
                          {item.variantName}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-heading font-bold text-gray-900 mb-2">
                      {formatCurrency(Number(item.price))}
                    </p>

                    {/* Stock Status */}
                    {loadingStocks ? (
                      <p className="text-xs text-gray-400 mb-2">Memeriksa stok...</p>
                    ) : isOutOfStock ? (
                      <p className="text-xs text-red-600 font-medium mb-2">
                        ⚠️ Stok habis
                      </p>
                    ) : isQuantityExceeded ? (
                      <p className="text-xs text-orange-600 font-medium mb-2">
                        ⚠️ Stok tersedia: {currentStock} unit
                      </p>
                    ) : currentStock < 5 && currentStock > 0 ? (
                      <p className="text-xs text-gray-600 mb-2">
                        Stok tersedia: {currentStock} unit
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          disabled={isOutOfStock || item.quantity <= 1}
                          className="w-7 h-7 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                        >
                          <Icon name="ChevronDown" size={14} className="rotate-90" />
                        </button>
                        <span className={`w-10 text-center text-xs font-body font-medium ${
                          isQuantityExceeded ? 'text-red-600 font-bold' : ''
                        }`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity < maxQuantity) {
                              updateQuantity(itemKey, item.quantity + 1)
                            }
                          }}
                          disabled={isOutOfStock || item.quantity >= maxQuantity}
                          className="w-7 h-7 border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                        >
                          <Icon name="ChevronDown" size={14} className="-rotate-90" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(itemKey)}
                        className="text-xs font-body text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 sticky top-20">
              <h2 className="text-lg font-heading font-medium text-gray-900 mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-xs font-body text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-body text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(shippingFee)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-sm font-heading font-medium text-gray-900">Total</span>
                <span className="text-base font-heading font-medium text-gray-900">
                  {formatCurrency(finalTotal)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full mb-4"
              >
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="uppercase tracking-wider"
                >
                  Proceed to Checkout
                </Button>
              </button>

              <Link
                to="/shop"
                className="block text-center text-sm font-body text-gray-600 hover:text-gray-900 uppercase tracking-wider transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CartPage
