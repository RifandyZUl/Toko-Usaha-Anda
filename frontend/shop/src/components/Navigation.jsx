import { Link } from 'react-router-dom'
import Icon from '@shared/components/Icon'
import useCartStore from '../stores/cartStore'

/**
 * Shop Navigation Component
 */
function Navigation() {
  const { getTotalItems, isOpen, toggleCart } = useCartStore()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-md border-b border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-lg font-heading font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              Toko Usaha Anda
            </h1>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-body font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              🏠 Beranda
            </Link>
            <Link
              to="/shop"
              className="text-sm font-body font-medium text-gray-600 hover:text-primary-600 transition-colors"
            >
              🛍️ Belanja
            </Link>
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Icon name="ShoppingCart" size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600"
            >
              <Icon name="ShoppingCart" size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

