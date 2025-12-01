import { Link } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'

/**
 * Reusable Shop Navigation Component - Elegant Design
 */
function ShopNavigation() {
  const { getTotalItems } = useCartStore()
  const { user, isAuthenticated, logout } = useAuthStore()
  const totalItems = getTotalItems()

  return (
    <nav className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Search Button - Left */}
          <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
            <Icon name="Search" size={20} />
          </button>

          {/* Logo - Center */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Toko Usaha Anda" 
              className="h-8 w-auto"
              onError={(e) => {
                // Fallback to text if logo fails
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <h1 className="text-lg font-heading font-medium tracking-tight text-gray-900 hidden">
              TOKO USAHA ANDA
            </h1>
          </Link>

          {/* Navigation Links - Right */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-xs font-body text-primary-600 uppercase tracking-wider font-medium"
            >
              Shop
            </Link>
            {isAuthenticated() ? (
              <div className="flex items-center gap-4">
                <span className="text-xs font-body text-gray-600">{user?.name}</span>
                <button
                  onClick={logout}
                  className="text-xs font-body text-gray-600 hover:text-gray-900 uppercase tracking-wider transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/shop/login"
                className="text-xs font-body text-gray-600 hover:text-gray-900 uppercase tracking-wider transition-colors"
              >
                Login
              </Link>
            )}
            <Link
              to="/shop/cart"
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Icon name="ShoppingCart" size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
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

export default ShopNavigation

