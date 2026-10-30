import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProducts, getCategories } from '../services/products'
import ShopNavigation from '../components/ShopNavigation'
import ProductCard from '../components/ProductCard'
import ProductGridSkeleton from '../components/ProductGridSkeleton'
import EmptyState from '../components/EmptyState'
import BackToTop from '../components/BackToTop'
import Icon from '@shared/components/Icon.jsx'

/**
 * Dedicated Category Page
 * Displays products filtered for a specific canonical category
 */
function CategoryPage() {
  const { slug } = useParams()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'price-asc' | 'price-desc'

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await getCategories()
        const list = Array.isArray(res) ? res : res.categories || []
        setCategories(list)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    loadCategories()
  }, [])

  // Find active category
  const currentCategory = useMemo(() => {
    return categories.find(c => c.slug === slug || c.id === slug) || null
  }, [categories, slug])

  // Fetch products for this category
  useEffect(() => {
    async function loadCategoryProducts() {
      setLoading(true)
      setError(null)
      try {
        const res = await getProducts({
          category: slug,
          limit: 100,
        })

        if (res.success && res.products) {
          setProducts(res.products)
        } else {
          setProducts([])
        }
      } catch (err) {
        setError('Gagal memuat produk untuk kategori ini.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadCategoryProducts()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [slug])

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...products]
    if (sortBy === 'price-asc') {
      return list.sort((a, b) => Number(a.price) - Number(b.price))
    }
    if (sortBy === 'price-desc') {
      return list.sort((a, b) => Number(b.price) - Number(a.price))
    }
    return list // newest default
  }, [products, sortBy])

  const categoryTitle = currentCategory?.name || (
    slug === 'household' ? 'Kebutuhan Rumah Tangga' :
    slug === 'tools' ? 'Perkakas Tukang' :
    slug === 'motorcycle' ? 'Alat Alat Motor' : slug
  )

  const categoryDescription = currentCategory?.description || (
    slug === 'household' ? 'Koleksi perlengkapan kebersihan dan kebutuhan harian rumah tangga berkualitas.' :
    slug === 'tools' ? 'Peralatan pertukangan, kunci, palu, dan perkakas teknik lengkap berstandar tinggi.' :
    slug === 'motorcycle' ? 'Aksesoris motor, gembok cakram, tali bagasi, dan perlengkapan motor pilihan.' : ''
  )

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ShopNavigation />

      {/* Category Header & Breadcrumb */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-body">
            <Link to="/shop" className="hover:text-gray-900 transition-colors">
              Beranda
            </Link>
            <Icon name="ChevronRight" size={12} className="text-gray-400" />
            <span className="text-gray-400">Kategori</span>
            <Icon name="ChevronRight" size={12} className="text-gray-400" />
            <span className="text-gray-900 font-medium">{categoryTitle}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-medium text-gray-900 tracking-tight">
                {categoryTitle}
              </h1>
              {categoryDescription && (
                <p className="text-sm font-body text-gray-600 mt-1 max-w-2xl leading-relaxed">
                  {categoryDescription}
                </p>
              )}
            </div>

            {/* Total items badge */}
            <div className="text-xs font-body text-gray-500 whitespace-nowrap">
              Menampilkan <strong className="text-gray-900">{sortedProducts.length}</strong> produk
            </div>
          </div>

          {/* Quick Category Switcher Tabs */}
          <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-gray-100">
            <Link
              to="/shop/all"
              className="px-3.5 py-1.5 rounded-full text-xs font-body font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/90 transition-colors"
            >
              Semua Produk
            </Link>
            {categories.map(cat => {
              const isActive = cat.slug === slug
              return (
                <Link
                  key={cat.id || cat.slug}
                  to={`/shop/category/${cat.slug}`}
                  style={isActive ? { color: '#ffffff', backgroundColor: '#111827' } : undefined}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 !text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/90'
                  }`}
                >
                  {cat.name}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Product Grid */}
      <main className="container-custom py-8">
        {/* Sort Filter Bar */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200/60">
          <p className="text-xs text-gray-500 font-body">
            Katalog Resmi Toko Usaha Anda
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="sortSelect" className="text-xs font-body text-gray-600">
              Urutkan:
            </label>
            <select
              id="sortSelect"
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

        {/* Content State */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Link
              to="/shop"
              className="inline-block px-4 py-2 text-xs uppercase tracking-wider bg-gray-900 text-white rounded-md"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : sortedProducts.length === 0 ? (
          <EmptyState
            title="Belum Ada Produk"
            message={`Saat ini belum ada produk yang tersedia untuk kategori ${categoryTitle}.`}
            actionLabel="Lihat Semua Produk"
            actionLink="/shop/all"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <BackToTop />
    </div>
  )
}

export default CategoryPage
