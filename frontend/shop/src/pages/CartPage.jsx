import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import ShopNavigation from '../components/navigation/ShopNavigation'
import { formatCurrency } from '../utils/format'
import { logError, logInfo } from '../utils/logger'
import { getProductById } from '../services/products'

/**
 * Modern Premium Cart Page - Toko Usaha Anda E-Commerce
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
  const totalItemCount = useMemo(() => items.reduce((acc, it) => acc + (it.quantity || 1), 0), [items])

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <ShopNavigation />
        <main className="container-custom py-20">
          <div className="max-w-md mx-auto text-center bg-white rounded-3xl p-10 border border-gray-100 shadow-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
              <Icon name="ShoppingCart" size={36} />
            </div>
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-3">
              Keranjang Belanja Masih Kosong
            </h2>
            <p className="text-sm font-body text-gray-500 mb-8 leading-relaxed">
              Jelajahi berbagai kebutuhan rumah tangga, perkakas tukang, dan alat motor pilihan kami untuk mulai berbelanja.
            </p>
            <Link to="/shop">
              <Button variant="primary" size="lg" className="w-full uppercase tracking-wider py-3 shadow-md hover:shadow-lg transition-all">
                Mulai Belanja Sekarang
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <ShopNavigation />
      
      <main className="container-custom py-10 md:py-14">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-body">
            <Link to="/shop" className="hover:text-primary-600 transition-colors">Toko</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Keranjang Belanja</span>
          </nav>
          
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-medium text-gray-900 tracking-tight">
                Keranjang Belanja
              </h1>
              <p className="text-xs md:text-sm font-body text-gray-500 mt-1">
                Ada <span className="font-semibold text-gray-800">{items.length} jenis produk</span> ({totalItemCount} total item) siap diproses
              </p>
            </div>
            
            <Link
              to="/shop"
              className="text-xs font-body font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="ArrowLeft" size={14} />
              <span>Tambah Produk Lain</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const itemKey = item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)
              const currentStock = productStocks[itemKey] !== undefined 
                ? productStocks[itemKey] 
                : (item.stock || 0)
              const isOutOfStock = currentStock === 0
              const isQuantityExceeded = item.quantity > currentStock
              const maxQuantity = Math.max(0, currentStock)
              const itemSubtotal = Number(item.price) * item.quantity

              return (
                <div
                  key={itemKey}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:border-gray-200 transition-all flex flex-col sm:flex-row gap-4 sm:gap-5"
                >
                  {/* Product Image Thumbnail */}
                  <Link
                    to={`/shop/product/${item.id}`}
                    className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 overflow-hidden bg-gray-50 rounded-xl border border-gray-100 group"
                  >
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={e => {
                        e.target.src = '/placeholder.jpg'
                      }}
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Link
                          to={`/shop/product/${item.id}`}
                          className="hover:text-primary-600 transition-colors"
                        >
                          <h3 className="text-sm sm:text-base font-heading font-medium text-gray-900 leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        
                        {/* Remove Action */}
                        <button
                          onClick={() => removeItem(itemKey)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                          title="Hapus dari keranjang"
                          aria-label="Hapus produk"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>

                      {/* Variant Badge & Price per item */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {item.variantName ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Varian: {item.variantName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                            Standar
                          </span>
                        )}

                        <span className="text-xs text-gray-400 font-body">
                          @ {formatCurrency(Number(item.price))}
                        </span>
                      </div>

                      {/* Stock Warning Notice */}
                      {loadingStocks ? (
                        <p className="text-xs text-gray-400 mb-2 font-body flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-gray-300 animate-pulse"></span>
                          Memeriksa ketersediaan stok...
                        </p>
                      ) : isOutOfStock ? (
                        <p className="text-xs text-red-600 font-medium mb-2 font-body flex items-center gap-1">
                          <Icon name="AlertCircle" size={13} />
                          Stok varian ini habis, silakan hapus item untuk checkout.
                        </p>
                      ) : isQuantityExceeded ? (
                        <p className="text-xs text-orange-600 font-medium mb-2 font-body flex items-center gap-1">
                          <Icon name="AlertTriangle" size={13} />
                          Jumlah melebihi stok yang tersisa ({currentStock} unit).
                        </p>
                      ) : currentStock <= 5 && currentStock > 0 ? (
                        <p className="text-xs text-amber-700 font-medium mb-2 font-body">
                          ⚡ Sisa {currentStock} unit lagi di toko!
                        </p>
                      ) : null}
                    </div>

                    {/* Bottom Controls: Quantity & Subtotal */}
                    <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between gap-4">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center border border-gray-200 rounded-xl bg-gray-50/70 p-0.5">
                        <button
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                          disabled={isOutOfStock || item.quantity <= 1}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-gray-700 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          aria-label="Kurangi jumlah"
                        >
                          <Icon name="Minus" size={12} />
                        </button>
                        
                        <span className={`w-9 sm:w-11 text-center text-xs sm:text-sm font-body font-semibold ${
                          isQuantityExceeded ? 'text-red-600' : 'text-gray-900'
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
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white shadow-xs text-gray-700 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          aria-label="Tambah jumlah"
                        >
                          <Icon name="Plus" size={12} />
                        </button>
                      </div>

                      {/* Row Subtotal */}
                      <div className="text-right">
                        <p className="text-[11px] font-body text-gray-400">Total Harga</p>
                        <p className="text-sm sm:text-base font-heading font-semibold text-gray-900">
                          {formatCurrency(itemSubtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h2 className="text-lg font-heading font-medium text-gray-900 mb-5 pb-3 border-b border-gray-100">
                Ringkasan Pesanan
              </h2>
              
              <div className="space-y-3 mb-6 pb-5 border-b border-gray-100">
                <div className="flex justify-between text-xs sm:text-sm font-body text-gray-600">
                  <span>Total Harga ({totalItemCount} barang)</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm font-body text-gray-600">
                  <span className="flex items-center gap-1">
                    Estimasi Ongkir
                    <span className="text-[11px] text-gray-400">(Standar)</span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(shippingFee)}
                  </span>
                </div>
              </div>

              {/* Total Payment Amount */}
              <div className="flex justify-between items-baseline mb-6">
                <div>
                  <span className="text-sm font-heading font-medium text-gray-900 block">Total Tagihan</span>
                  <span className="text-[11px] text-gray-400 font-body">Sudah termasuk ongkir estimasi</span>
                </div>
                <span className="text-xl sm:text-2xl font-heading font-bold text-primary-600">
                  {formatCurrency(finalTotal)}
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={items.some(item => {
                  const itemKey = item.cartKey || (item.variantId ? `${item.id}-${item.variantId}` : item.id)
                  const st = productStocks[itemKey]
                  return st !== undefined && (st === 0 || item.quantity > st)
                })}
                className="w-full mb-4 group cursor-pointer disabled:cursor-not-allowed"
              >
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="uppercase tracking-wider py-3.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <Icon name="ArrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </button>

              <Link
                to="/shop"
                className="block text-center text-xs font-body font-medium text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors py-1"
              >
                Lanjutkan Belanja
              </Link>

              {/* Security & Service Trust Badges */}
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center gap-2.5 text-[11px] text-gray-500 font-body">
                  <span className="text-primary-600">🛡️</span>
                  <span>Produk 100% Original & Berkualitas</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-gray-500 font-body">
                  <span className="text-primary-600">📦</span>
                  <span>Packing Rapi & Pengiriman Terpercaya</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-gray-500 font-body">
                  <span className="text-primary-600">🔒</span>
                  <span>Pembayaran Aman (QRIS, VA & Transfer Bank)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CartPage
