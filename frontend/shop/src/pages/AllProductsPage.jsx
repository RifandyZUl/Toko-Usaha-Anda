import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, getCategories } from '../services/products'
import ShopNavigation from '../components/navigation/ShopNavigation'
import ProductCard from '../components/product/ProductCard'
import ProductGridSkeleton from '../components/common/ProductGridSkeleton'
import EmptyState from '../components/common/EmptyState'
import BackToTop from '../components/common/BackToTop'
import Icon from '@shared/components/Icon.jsx'

/**
 * All Products Page (All Collection)
 * Displays all products with full category filtering, search, and sorting
 */
function AllProductsPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [catsRes, prodsRes] = await Promise.all([
          getCategories(),
          getProducts({ limit: 100 }),
        ])

        const cats = Array.isArray(catsRes) ? catsRes : catsRes.categories || []
        setCategories(cats)

        if (prodsRes.success && prodsRes.products) {
          setProducts(prodsRes.products)
        }
      } catch (err) {
        setError('Gagal memuat produk. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category?.slug === selectedCategory || p.categoryId === selectedCategory)
    }

    if (sortBy === 'price-asc') {
      return list.sort((a, b) => Number(a.price) - Number(b.price))
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => Number(b.price) - Number(a.price))
    }
    return list
  }, [products, selectedCategory, sortBy])

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      {/* Header Banner */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-body">
            <Link to="/shop" className="hover:text-gray-900 transition-colors">
              Beranda
            </Link>
            <Icon name="ChevronRight" size={12} className="text-gray-400" />
            <span className="text-gray-900 font-medium">Semua Produk</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-medium text-gray-900 tracking-tight">
                All Collection
              </h1>
              <p className="text-sm font-body text-gray-600 mt-1 max-w-2xl leading-relaxed">
                Jelajahi seluruh koleksi produk kebutuhan rumah tangga, perkakas teknik, dan perlengkapan motor.
              </p>
            </div>

            <div className="text-xs font-body text-gray-500 whitespace-nowrap">
              Menampilkan <strong className="text-gray-900">{filteredProducts.length}</strong> produk
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => setSelectedCategory('all')}
              style={selectedCategory === 'all' ? { color: '#ffffff', backgroundColor: '#111827' } : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 !text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/90'
              }`}
            >
              Semua Produk
            </button>
            {categories.map(cat => {
              const isActive = selectedCategory === cat.slug
              return (
                <button
                  key={cat.id || cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  style={isActive ? { color: '#ffffff', backgroundColor: '#111827' } : undefined}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 !text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/90'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Sort Filter Bar */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200/60">
          <p className="text-xs text-gray-500 font-body">
            Koleksi Terverifikasi Toko Usaha Anda
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="allSortSelect" className="text-xs font-body text-gray-600">
              Urutkan:
            </label>
            <select
              id="allSortSelect"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs font-body border border-gray-300 rounded-md px-2.5 py-1.5 bg-white text-gray-900 focus:outline-none focus:border-gray-900"
            >
              <option value="newest">Terbaru</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-sm mb-4">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="Tidak Ada Produk"
            message="Tidak ada produk yang cocok dengan filter yang dipilih."
            actionLabel="Reset Filter"
            onAction={() => setSelectedCategory('all')}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <BackToTop />
    </div>
  )
}

export default AllProductsPage
