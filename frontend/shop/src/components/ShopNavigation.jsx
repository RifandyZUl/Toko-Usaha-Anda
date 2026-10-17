import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '@shared/components/Icon.jsx'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { getProducts } from '../services/products'

// Helper to resolve landing page URL dynamically based on environment
const LANDING_URL =
  import.meta.env.VITE_LANDING_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '/')

/**
 * Reusable Shop Navigation Component - Premium E-Commerce Design with Search Overlay Modal
 */
function ShopNavigation() {
  const { getTotalItems } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const totalItems = getTotalItems()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Autocomplete & History State
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('searchHistory')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [suggestedProducts, setSuggestedProducts] = useState([])
  const [suggestedQueries, setSuggestedQueries] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const modalInputRef = useRef(null)
  const modalContainerRef = useRef(null)

  // Popular search terms
  const popularSearches = ['sapu', 'obeng', 'kunci pas', 'perkakas', 'alat motor', 'lap serat']

  // Save history helper
  const addToHistory = (query) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())
      const updated = [trimmed, ...filtered].slice(0, 5)
      localStorage.setItem('searchHistory', JSON.stringify(updated))
      return updated
    })
  }

  // Remove history helper
  const removeFromHistory = (e, itemToRemove) => {
    e.stopPropagation()
    setSearchHistory(prev => {
      const updated = prev.filter(item => item !== itemToRemove)
      localStorage.setItem('searchHistory', JSON.stringify(updated))
      return updated
    })
  }

  // Execute Search
  const triggerSearch = (query) => {
    const trimmed = query.trim()
    if (!trimmed) return

    addToHistory(trimmed)
    setIsSearchModalOpen(false)

    if (location.pathname === '/shop' || location.pathname === '/shop/') {
      const event = new CustomEvent('searchProducts', { detail: { query: trimmed } })
      window.dispatchEvent(event)
    } else {
      localStorage.setItem('pendingSearchFilter', trimmed)
      navigate('/shop')
    }
  }

  const handleSearchSubmit = e => {
    e.preventDefault()
    triggerSearch(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSuggestedProducts([])
    setSuggestedQueries([])
    if (location.pathname === '/shop' || location.pathname === '/shop/') {
      const event = new CustomEvent('searchProducts', { detail: { query: '' } })
      window.dispatchEvent(event)
    }
  }

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestedProducts([])
      setSuggestedQueries([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await getProducts({ search: searchQuery.trim(), limit: 8 })
        if (res.success && res.products) {
          const productsArray = Array.isArray(res.products) ? res.products : []
          setSuggestedProducts(productsArray.slice(0, 3)) // top 3 products

          const query = searchQuery.trim().toLowerCase()
          const suggestions = new Set()
          suggestions.add(query) // default typed query

          productsArray.forEach(product => {
            const name = (product.name || '').toLowerCase()
            if (name.includes(query)) {
              const words = name.split(/\s+/)
              const index = words.findIndex(w => w.includes(query))
              if (index !== -1) {
                const phrase1 = words[index]
                if (phrase1 && phrase1.length > query.length) {
                  suggestions.add(phrase1)
                }
                if (index + 1 < words.length) {
                  const phrase2 = `${words[index]} ${words[index + 1]}`
                  suggestions.add(phrase2)
                }
              }
              const catName = (product.category?.name || '').toLowerCase()
              if (catName.includes(query)) {
                suggestions.add(catName)
              }
            }
          })

          const filteredSuggestions = Array.from(suggestions)
            .filter(item => item.includes(query))
            .slice(0, 6)

          setSuggestedQueries(filteredSuggestions)
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Scroll lock and Auto-focus
  useEffect(() => {
    if (isSearchModalOpen) {
      document.body.style.overflow = 'hidden'
      const timer = setTimeout(() => {
        if (modalInputRef.current) {
          modalInputRef.current.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isSearchModalOpen])

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false)
      }
    }
    if (isSearchModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchModalOpen])

  return (
    <nav className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-12 gap-4">
          {/* Logo/Nama Toko - Left */}
          <Link
            to="/shop"
            onClick={() => {
              localStorage.removeItem('pendingCategoryFilter')
              setSearchQuery('')
              if (location.pathname === '/shop' || location.pathname === '/shop/') {
                const event = new CustomEvent('filterCategory', { detail: { keywords: ['all'] } })
                window.dispatchEvent(event)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            className="flex items-center gap-1.5 flex-shrink-0"
          >
            <img
              src="/logo.png"
              alt="Toko Usaha Anda"
              className="h-6 w-auto"
              onError={e => {
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
              onClick={e => {
                e.preventDefault()
                localStorage.setItem(
                  'pendingCategoryFilter',
                  JSON.stringify(['rumah tangga', 'household', 'peralatan rumah'])
                )
                if (location.pathname === '/shop' || location.pathname === '/shop/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  const event = new CustomEvent('filterCategory', {
                    detail: { keywords: ['rumah tangga', 'household', 'peralatan rumah'] },
                  })
                  window.dispatchEvent(event)
                } else {
                  navigate('/shop')
                }
              }}
              className="text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
            >
              Peralatan Rumah Tangga
            </Link>
            <Link
              to="/shop"
              onClick={e => {
                e.preventDefault()
                localStorage.setItem(
                  'pendingCategoryFilter',
                  JSON.stringify(['perkakas', 'tools', 'tukang'])
                )
                if (location.pathname === '/shop' || location.pathname === '/shop/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  const event = new CustomEvent('filterCategory', {
                    detail: { keywords: ['perkakas', 'tools', 'tukang'] },
                  })
                  window.dispatchEvent(event)
                } else {
                  navigate('/shop')
                }
              }}
              className="text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
            >
              Perkakas Tukang
            </Link>
            <Link
              to="/shop"
              onClick={e => {
                e.preventDefault()
                localStorage.setItem(
                  'pendingCategoryFilter',
                  JSON.stringify(['motor', 'motorcycle', 'alat motor'])
                )
                if (location.pathname === '/shop' || location.pathname === '/shop/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  const event = new CustomEvent('filterCategory', {
                    detail: { keywords: ['motor', 'motorcycle', 'alat motor'] },
                  })
                  window.dispatchEvent(event)
                } else {
                  navigate('/shop')
                }
              }}
              className="text-xs font-body text-gray-600 hover:text-primary-600 uppercase tracking-wider transition-colors"
            >
              Alat Alat Motor
            </Link>
          </div>

          {/* Right Side: Search, Cart, Login */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search Bar - Desktop Trigger */}
            <div
              onClick={() => setIsSearchModalOpen(true)}
              className="hidden md:flex items-center gap-2 relative cursor-pointer"
            >
              <div className="absolute left-3 text-gray-400">
                <Icon name="Search" size={16} />
              </div>
              <div className="w-32 pl-9 pr-3 py-1.5 text-xs text-gray-400 border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all select-none">
                Search
              </div>
            </div>

            {/* Search Icon - Mobile Trigger */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
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
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-700 hover:text-primary-600 transition-colors"
              aria-label="Toggle Menu"
            >
              <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-3 px-4 space-y-3 transition-all duration-300">
          {/* Mobile Search Bar Trigger */}
          <div
            onClick={() => {
              setIsMobileMenuOpen(false)
              setIsSearchModalOpen(true)
            }}
            className="pb-2 border-b border-gray-100 relative cursor-pointer"
          >
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Icon name="Search" size={16} />
              </div>
              <div className="w-full pl-9 pr-3 py-1.5 text-sm text-gray-400 border border-gray-200 rounded-full bg-gray-50 select-none">
                Search products...
              </div>
            </div>
          </div>
          <a
            href={LANDING_URL}
            className="block text-xs font-body font-medium text-gray-700 hover:text-primary-600 uppercase tracking-wider"
          >
            Beranda
          </a>
          <Link
            to="/shop"
            onClick={e => {
              e.preventDefault()
              setIsMobileMenuOpen(false)
              localStorage.setItem(
                'pendingCategoryFilter',
                JSON.stringify(['rumah tangga', 'household', 'peralatan rumah'])
              )
              if (location.pathname === '/shop') {
                const event = new CustomEvent('filterCategory', {
                  detail: { keywords: ['rumah tangga', 'household', 'peralatan rumah'] },
                })
                window.dispatchEvent(event)
              } else {
                navigate('/shop')
              }
            }}
            className="block text-xs font-body font-medium text-gray-700 hover:text-primary-600 uppercase tracking-wider"
          >
            Peralatan Rumah Tangga
          </Link>
          <Link
            to="/shop"
            onClick={e => {
              e.preventDefault()
              setIsMobileMenuOpen(false)
              localStorage.setItem(
                'pendingCategoryFilter',
                JSON.stringify(['perkakas', 'tools', 'tukang'])
              )
              if (location.pathname === '/shop') {
                const event = new CustomEvent('filterCategory', {
                  detail: { keywords: ['perkakas', 'tools', 'tukang'] },
                })
                window.dispatchEvent(event)
              } else {
                navigate('/shop')
              }
            }}
            className="block text-xs font-body font-medium text-gray-700 hover:text-primary-600 uppercase tracking-wider"
          >
            Perkakas Tukang
          </Link>
          <Link
            to="/shop"
            onClick={e => {
              e.preventDefault()
              setIsMobileMenuOpen(false)
              localStorage.setItem(
                'pendingCategoryFilter',
                JSON.stringify(['motor', 'motorcycle', 'alat motor'])
              )
              if (location.pathname === '/shop') {
                const event = new CustomEvent('filterCategory', {
                  detail: { keywords: ['motor', 'motorcycle', 'alat motor'] },
                })
                window.dispatchEvent(event)
              } else {
                navigate('/shop')
              }
            }}
            className="block text-xs font-body font-medium text-gray-700 hover:text-primary-600 uppercase tracking-wider"
          >
            Alat Alat Motor
          </Link>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {isAuthenticated() ? (
              <Link
                to="/shop/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-body font-medium text-gray-700 hover:text-primary-600 uppercase tracking-wider"
              >
                <Icon name="Users" size={14} className="text-primary-600" />
                <span>{user?.name || 'Profil Saya'}</span>
              </Link>
            ) : (
              <Link
                to="/shop/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-xs font-body font-medium text-gray-700 hover:text-primary-600 uppercase tracking-wider"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}

      {/* SEARCH OVERLAY MODAL */}
      {isSearchModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSearchModalOpen(false)
            }
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] pt-16 px-4 overflow-y-auto"
        >
          <div
            ref={modalContainerRef}
            className="mx-auto max-w-2xl bg-white rounded-3xl shadow-2xl p-6 relative flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Top row: Input field + close icon */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icon name="Search" size={18} />
                </div>
                <input
                  ref={modalInputRef}
                  type="text"
                  placeholder="Cari produk di Toko Usaha Anda..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-24 py-3 bg-[#f3f3f3] border-none rounded-full text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <Icon name="X" size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black hover:bg-gray-800 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
                >
                  <Icon name="Search" size={14} className="text-white" />
                </button>
              </form>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 p-1.5 flex-shrink-0 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Tutup pencarian"
              >
                <Icon name="X" size={22} />
              </button>
            </div>

            {/* Loading State */}
            {isSearching && (
              <div className="flex items-center justify-center py-8 text-primary-600">
                <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm font-body text-gray-500">Mencari produk...</span>
              </div>
            )}

            {/* Empty Query Content: History & Popular searches */}
            {!searchQuery.trim() && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Recent Searches */}
                {searchHistory.length > 0 && (
                  <div>
                    <h4 className="text-xs font-heading font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Pencarian Terakhir
                    </h4>
                    <div className="space-y-1">
                      {searchHistory.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setSearchQuery(item)
                            triggerSearch(item)
                          }}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center gap-3 text-gray-700">
                            <Icon name="History" size={16} className="text-gray-400" />
                            <span className="text-sm font-body font-medium">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => removeFromHistory(e, item)}
                            className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <h4 className="text-xs font-heading font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Pencarian Populer
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSearchQuery(item)
                          triggerSearch(item)
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs font-body font-medium text-gray-700 hover:text-gray-900 transition-all"
                      >
                        <Icon name="Search" size={12} className="text-gray-400" />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active Query Content: Suggestions & Products preview */}
            {searchQuery.trim() && !isSearching && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Dynamic Query Suggestions */}
                {suggestedQueries.length > 0 && (
                  <div className="space-y-1">
                    {suggestedQueries.map((queryText, idx) => {
                      const queryClean = searchQuery.trim().toLowerCase()
                      const startsWithMatch = queryText.startsWith(queryClean)
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSearchQuery(queryText)
                            triggerSearch(queryText)
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl cursor-pointer text-gray-700 transition-colors"
                        >
                          <Icon name="Search" size={16} className="text-gray-400" />
                          <span className="text-sm font-body font-medium">
                            {startsWithMatch ? (
                              <>
                                <strong className="text-gray-900 font-semibold">{queryClean}</strong>
                                {queryText.slice(queryClean.length)}
                              </>
                            ) : (
                              queryText
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Related Products Preview Grid */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-heading font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Produk terkait
                  </h4>
                  {suggestedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {suggestedProducts.map(product => (
                        <Link
                          key={product.id}
                          to={`/shop/product/${product.id}`}
                          onClick={() => setIsSearchModalOpen(false)}
                          className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-2 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-200"
                        >
                          <div className="w-12 h-12 sm:w-full sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                            <img
                              src={product.image || product.imageUrl || '/placeholder.png'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.src = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&h=200&fit=crop'
                              }}
                            />
                          </div>
                          <div className="flex-1 sm:w-full min-w-0 sm:px-1">
                            <h5 className="text-xs font-body font-semibold text-gray-900 truncate">
                              {product.name}
                            </h5>
                            <p className="text-[10px] font-body text-primary-600 font-semibold mt-0.5">
                              Rp {product.price?.toLocaleString('id-ID')}
                            </p>
                            <p className="text-[9px] font-body text-gray-400">
                              {product.category?.name || 'Katalog'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-body text-gray-500 py-1">Tidak ada produk ditemukan.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default ShopNavigation
