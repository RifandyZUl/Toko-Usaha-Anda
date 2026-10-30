import { Link } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'

/**
 * Shared Navbar Component - Elegant Design
 */
function Navbar() {
  const { getTotalItems } = useCartStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  const totalItems = getTotalItems()

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-300 sticky top-0 z-50">
      <div className="container-custom">
        <div className="relative flex items-center justify-between h-16">
          {/* Search Button - Left */}
          <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors">
            <Icon name="Search" size={22} />
          </button>

          {/* Logo - Center */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <h1 className="text-xl font-heading font-semibold tracking-tight text-gray-900">
              TOKO USAHA ANDA
            </h1>
          </Link>

          {/* Navigation Links - Right */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-body font-medium text-gray-700 hover:text-gray-900 uppercase tracking-wider transition-colors"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-sm font-body font-medium text-gray-900 uppercase tracking-wider border-b-2 border-gray-900 pb-1"
            >
              Shop
            </Link>
            {isAuthenticated() ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-body text-gray-600">{user?.name}</span>
                <button
                  onClick={logout}
                  className="text-sm font-body text-gray-600 hover:text-gray-900 uppercase tracking-wider transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/shop/login"
                className="text-sm font-body font-medium text-gray-700 hover:text-gray-900 uppercase tracking-wider transition-colors"
              >
                Login
              </Link>
            )}
            <Link
              to="/shop/cart"
              className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Icon name="ShoppingCart" size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-700">
            <Icon name="Menu" size={24} />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
