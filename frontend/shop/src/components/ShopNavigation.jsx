import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'

/**
 * Reusable Shop Navigation Component - Elegant Design
 */
function ShopNavigation() {
  const { getTotalItems } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const totalItems = getTotalItems()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement search functionality
    // Search functionality will be implemented later
  }

  return (
    <nav className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-12 gap-4">
          {/* Logo/Nama Toko - Left */}
          <Link
            to="/"
            className="flex items-center gap-1.5 flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="Toko Usaha Anda"
              className="h-6 w-auto"
              onError={e => {
                // Fallback to text if logo fails
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <h1 className="text-base font-heading font-medium tracking-tight text-gray-900 hidden sm:block">
              TOKO USAHA ANDA
            </h1>
          </Link>

          {/* Category Navigation - Center */}
          <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            <Link
              to="/shop"
              onClick={(e) => {
                e.preventDefault()
                // Scroll to top and filter by rumah tangga
                window.scrollTo({ top: 0, behavior: 'smooth' })
                // Trigger category filter - will be handled by ShopPage
                const event = new CustomEvent('filterCategory', { detail: { keywords: ['rumah tangga', 'household', 'peralatan rumah'] } })
                window.dispatchEvent(event)
              }}
              className="text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
            >
              Peralatan Rumah Tangga
            </Link>
            <Link
              to="/shop"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
                const event = new CustomEvent('filterCategory', { detail: { keywords: ['perkakas', 'tools', 'tukang'] } })
                window.dispatchEvent(event)
              }}
              className="text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
            >
              Perkakas Tukang
            </Link>
            <Link
              to="/shop"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
                const event = new CustomEvent('filterCategory', { detail: { keywords: ['motor', 'motorcycle', 'alat motor'] } })
                window.dispatchEvent(event)
              }}
              className="text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
            >
              Alat Alat Motor
            </Link>
          </div>

          {/* Right Side: Search, Cart, Login */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:block">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon name="Search" size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </form>
            
            {/* Search Icon for Mobile */}
            <button 
              className="md:hidden p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
              aria-label="Search"
            >
              <Icon name="Search" size={20} />
            </button>

            {/* Cart (Keranjang) */}
            <Link
              to="/shop/cart"
              className="relative p-1.5 text-gray-600 hover:text-primary-600 transition-colors"
              aria-label="Shopping Cart"
            >
              <Icon name="ShoppingCart" size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Login/User Menu */}
            {isAuthenticated() ? (
              <Link
                to="/shop/profile"
                className="hidden md:flex items-center gap-2 text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-full hover:bg-primary-50 group"
              >
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Icon name="Users" size={14} className="text-primary-600" />
                </div>
                <span className="font-medium">{user?.name || 'Profil Saya'}</span>
              </Link>
            ) : (
              <Link
                to="/shop/login"
                className="hidden md:block text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors px-2 py-1"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button className="md:hidden p-1.5 text-gray-700">
              <Icon name="Menu" size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default ShopNavigation
