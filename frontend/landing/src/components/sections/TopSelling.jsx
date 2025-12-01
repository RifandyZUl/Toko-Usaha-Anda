import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'
import Button from '../common/Button'
import { scrollToElement } from '../../utils/scroll'

/**
 * Top Selling Products Section - Produk Terlaris
 */
function TopSelling() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const topProducts = [
    { 
      name: 'Sapu Lantai', 
      price: 'Rp 25.000',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695e69502?w=600&h=600&fit=crop&q=80'
    },
    { 
      name: 'Palu Besi', 
      price: 'Rp 45.000',
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=600&fit=crop&q=80'
    },
    { 
      name: 'Cakram Rem Motor', 
      price: 'Rp 125.000',
      image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&h=600&fit=crop&q=80'
    },
    { 
      name: 'Obeng Set', 
      price: 'Rp 85.000',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa926e5c68?w=600&h=600&fit=crop&q=80'
    },
    { 
      name: 'Ember Plastik', 
      price: 'Rp 35.000',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&q=80'
    },
    { 
      name: 'Kunci Ring Set', 
      price: 'Rp 95.000',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&q=80'
    },
  ]

  const handleButtonClick = () => {
    scrollToElement('products')
  }

  return (
    <Section id="top-selling" alternate ref={ref} className="bg-beige-50">
      {/* Section Header */}
      <div className="text-center mb-12 sm:mb-16">
        <p className="text-sm sm:text-base text-brown-600 uppercase tracking-wider mb-2 font-body">
          PRODUK PILIHAN PELANGGAN
        </p>
        <h2 className="text-[36px] sm:text-[42px] md:text-[48px] lg:text-[56px] font-heading font-bold text-brown-900">
          Produk Terlaris
        </h2>
      </div>

      {/* Grid Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-10 sm:mb-12">
        {topProducts.map((product, index) => (
          <div
            key={index}
            className={`group transition-all duration-700 ${
              hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              {/* Product Image */}
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-beige-100 to-brown-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              
              {/* Product Info */}
              <div className="p-4 text-center">
                <h3 className="text-sm sm:text-base font-heading font-semibold text-brown-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-base sm:text-lg font-heading font-bold text-brown-700">
                  {product.price}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Products Button */}
      <div className="text-center">
        <Button
          onClick={handleButtonClick}
          variant="primary"
          size="lg"
          className="bg-brown-600 hover:bg-brown-700 text-white font-semibold px-10 py-4 text-lg"
        >
          Lihat Semua Produk
        </Button>
      </div>
    </Section>
  )
}

export default TopSelling
