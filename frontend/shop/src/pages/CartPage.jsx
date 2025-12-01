import { Link } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import ShopNavigation from '../components/ShopNavigation'

/**
 * Cart Page - Toko Usaha Anda E-Commerce
 */
function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
  } = useCartStore()

  const totalPrice = getTotalPrice()
  const shippingFee = 15000
  const finalTotal = totalPrice + shippingFee

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
          <div className="lg:col-span-2 space-y-6">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-white border-b border-gray-200 pb-6 flex gap-6"
              >
                {/* Product Image */}
                <Link
                  to={`/shop/product/${item.id}`}
                  className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 overflow-hidden bg-gray-50"
                >
                  <img
                    src={item.image || '/placeholder.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.src = '/placeholder.jpg'
                    }}
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-1 flex flex-col">
                  <Link
                    to={`/shop/product/${item.id}`}
                    className="mb-2 hover:text-gray-600 transition-colors"
                  >
                    <h3 className="text-base font-heading font-medium text-gray-900">
                      {item.name}
                    </h3>
                  </Link>
                  
                  <p className="text-base font-heading font-medium text-gray-900 mb-4">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Icon name="ChevronDown" size={16} className="rotate-90" />
                      </button>
                      <span className="w-12 text-center text-sm font-body font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Icon name="ChevronDown" size={16} className="-rotate-90" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-body text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 sticky top-20">
              <h2 className="text-xl font-heading font-medium text-gray-900 mb-6">
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
                <div className="flex justify-between text-sm font-body text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-body text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">
                    Rp {shippingFee.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mb-8">
                <span className="text-base font-heading font-medium text-gray-900">Total</span>
                <span className="text-lg font-heading font-medium text-gray-900">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <Link to="/shop/checkout" className="block mb-4">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  className="uppercase tracking-wider"
                >
                  Proceed to Checkout
                </Button>
              </Link>

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
