import { useState, useEffect } from 'react'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { SHOP_URL, CONTACT_WHATSAPP, API_BASE_URL } from '../../utils/constants'

// High-quality product images for fallback products
import imgSapu from '../../assets/products/sapu.jpg'
import imgWajan from '../../assets/products/wajan.jpg'
import imgPalu from '../../assets/products/palu.jpg'
import imgGergaji from '../../assets/products/gergaji.jpg'

// Fallback catalog products with matching high-resolution photography
const FALLBACK_PRODUCTS = [
  {
    id: 'sapu',
    name: 'Sapu Lantai Premium',
    description: 'Sapu berkualitas tinggi untuk membersihkan lantai dengan efektif dan tahan lama.',
    price: 25000,
    category: { name: 'Kebutuhan Rumah Tangga' },
    badge: 'Terlaris',
    image: imgSapu,
  },
  {
    id: 'wajan',
    name: 'Wajan Masak Anti Lengket',
    description: 'Wajan anti lengket untuk memasak dengan panas merata dan hasil maksimal.',
    price: 75000,
    category: { name: 'Kebutuhan Rumah Tangga' },
    badge: 'Populer',
    image: imgWajan,
  },
  {
    id: 'palu',
    name: 'Palu Tukang Baja',
    description: 'Palu baja kokoh untuk pekerjaan konstruksi, bengkel, dan perbaikan rumah.',
    price: 45000,
    category: { name: 'Perkakas Tukang' },
    badge: null,
    image: imgPalu,
  },
  {
    id: 'gergaji',
    name: 'Gergaji Kayu Presisi',
    description: 'Gergaji dengan mata pisau tajam untuk memotong kayu dan bahan lainnya.',
    price: 85000,
    category: { name: 'Perkakas Tukang' },
    badge: 'Pilihan',
    image: imgGergaji,
  },
]

function getFallbackImageByName(name = '', slug = '') {
  const text = `${name} ${slug}`.toLowerCase()
  if (text.includes('sapu')) return imgSapu
  if (text.includes('wajan') || text.includes('panci') || text.includes('dapur')) return imgWajan
  if (text.includes('palu') || text.includes('martil')) return imgPalu
  if (text.includes('gergaji') || text.includes('saw')) return imgGergaji
  return null
}

function formatPrice(price) {
  const num = Number(price)
  if (isNaN(num)) return price || 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

function resolveImageUrl(product) {
  const rawUrl = product?.imageUrl || product?.image
  if (rawUrl && typeof rawUrl === 'string') {
    const trimmed = rawUrl.trim()
    if (/^(https?:\/\/|data:)/i.test(trimmed)) {
      return trimmed
    }
    if (trimmed.startsWith('blob:') || trimmed.includes('/assets/products/')) {
      return trimmed
    }
    const backendBase = API_BASE_URL.replace(/\/api\/?$/, '')
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${backendBase}${cleanPath}`
  }

  return getFallbackImageByName(product?.name, product?.slug)
}

function FeaturedProducts() {
  const [ref, hasIntersected] = useIntersectionObserver()
  const [products, setProducts] = useState(FALLBACK_PRODUCTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchFeatured() {
      try {
        setLoading(true)
        // First try /products/featured
        let res = await fetch(`${API_BASE_URL}/products/featured?limit=4`)
        let data = null

        if (res.ok) {
          data = await res.json()
        } else {
          // Fallback to standard /products endpoint
          res = await fetch(`${API_BASE_URL}/products?limit=4`)
          if (res.ok) {
            data = await res.json()
          }
        }

        const items = data?.products || (Array.isArray(data) ? data : null)
        if (isMounted && Array.isArray(items) && items.length > 0) {
          setProducts(items.slice(0, 4))
        }
      } catch {
        // Fallback to initial products if backend is not reachable
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchFeatured()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section
      id="featured"
      ref={ref}
      className="py-24 md:py-32 bg-white border-t border-griya-outline/20"
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-6">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-griya-primary mb-2">
              Produk Unggulan
            </h2>
            <p className="font-sans text-sm text-griya-muted max-w-lg">
              Koleksi produk terlaris dan paling sering dibeli di toko kami untuk perkakas, rumah tangga, dan otomotif.
            </p>
          </div>
          <a
            href={`${SHOP_URL}/shop`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-sans tracking-[0.2em] uppercase font-semibold text-griya-primary hover:text-griya-secondary transition-colors duration-300 group pb-1"
          >
            Lihat Semua <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className="bg-white border border-griya-outline/20 p-4 sm:p-5 flex flex-col animate-pulse"
              >
                <div className="aspect-square bg-griya-surface-low mb-6 rounded"></div>
                <div className="h-4 bg-griya-surface-low rounded w-3/4 mb-2 mx-auto"></div>
                <div className="h-3 bg-griya-surface-low rounded w-5/6 mb-6 mx-auto"></div>
                <div className="h-4 bg-griya-surface-low rounded w-1/2 mb-6 mx-auto"></div>
                <div className="h-10 bg-griya-surface-low rounded w-full mt-auto"></div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => {
              const imageUrl = resolveImageUrl(product)
              const productLink = product.id && product.id.length > 10
                ? `${SHOP_URL}/shop/product/${product.id}`
                : `${SHOP_URL}/shop`
              const badgeText = product.badge || (index === 0 ? 'Terlaris' : null)

              return (
                <div
                  key={product.id || index}
                  className={`group flex flex-col bg-white border border-griya-outline/30 p-4 sm:p-5 transition-all duration-700 transform hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 ${
                    hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  {/* Product Image */}
                  <a
                    href={productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square relative overflow-hidden bg-griya-surface-low mb-6 block"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-[6000ms] ease-out group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          const fallback = getFallbackImageByName(product?.name, product?.slug)
                          if (fallback && e.target.src !== fallback) {
                            e.target.src = fallback
                            return
                          }
                          e.target.style.display = 'none'
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center text-griya-muted/50 bg-griya-surface-low ${
                        imageUrl ? 'hidden' : 'flex'
                      }`}
                    >
                      <ShoppingBag size={40} strokeWidth={1.2} />
                      <span className="text-[11px] font-sans uppercase tracking-widest mt-2 text-griya-muted">
                        {product.category?.name || 'Toko Usaha Anda'}
                      </span>
                    </div>

                    {badgeText && (
                      <div className="absolute top-3 left-3 bg-griya-primary text-white px-3 py-1 text-[10px] font-sans font-medium uppercase tracking-[0.15em] shadow-sm">
                        {badgeText}
                      </div>
                    )}
                  </a>

                  {/* Product Info */}
                  <div className="flex flex-col flex-grow text-center">
                    {product.category?.name && (
                      <span className="text-[11px] font-sans text-griya-secondary uppercase tracking-widest mb-1 font-medium">
                        {product.category.name}
                      </span>
                    )}

                    <a
                      href={productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-lg text-griya-primary mb-2 line-clamp-1 hover:text-griya-secondary transition-colors"
                    >
                      {product.name}
                    </a>

                    <p className="font-sans text-[13px] text-griya-muted mb-6 line-clamp-2 leading-relaxed">
                      {product.description || 'Produk berkualitas pilihan terbaik dari Toko Usaha Anda.'}
                    </p>

                    <div className="mt-auto flex items-center justify-center mb-6">
                      <span className="text-griya-primary font-sans font-semibold text-base">
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/${CONTACT_WHATSAPP}?text=Halo%2C%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full border border-griya-outline/50 text-griya-primary text-center py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-griya-primary hover:text-white transition-all duration-300"
                    >
                      Pesan via WhatsApp
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
