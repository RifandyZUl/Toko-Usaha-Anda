import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'
import Button from '../common/Button'
import { scrollToElement } from '../../utils/scroll'

/**
 * Featured Products section - Grid dengan aspect ratio berbeda untuk variasi menarik
 */
function FeaturedProducts() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const featuredProducts = [
    {
      name: 'Sapu Lantai Premium',
      price: 'Rp 25.000',
      image: 'https://i.pinimg.com/736x/c2/20/3a/c2203a1af3d534c2671a12a9eac5055e.jpg',
      aspectRatio: 'aspect-[3/4]', // lebih tinggi
    },
    {
      name: 'Palu Besi Profesional',
      price: 'Rp 45.000',
      image: 'https://i.pinimg.com/736x/be/c1/5d/bec15d35f88f17ead78d398c2b61e8a2.jpg',
      aspectRatio: 'aspect-square', // persegi
    },
    {
      name: 'Cakram Rem Motor',
      price: 'Rp 125.000',
      image: 'https://i.pinimg.com/1200x/9b/1e/59/9b1e595d9e930bb6ea862228bcd2d044.jpg',
      aspectRatio: 'aspect-[4/5]', // sedikit lebih tinggi
    },
    {
      name: 'Obeng Set Lengkap',
      price: 'Rp 85.000',
      image: 'https://i.pinimg.com/1200x/24/4c/cd/244ccd2a12f74ec49f71acc29ae3f6f8.jpg',
      aspectRatio: 'aspect-[3/4]', // lebih tinggi
    },
  ]

  const handleButtonClick = () => {
    scrollToElement('contact')
  }

  return (
    <Section id="featured" ref={ref} className="bg-white py-24 sm:py-32">
      {/* Section Header */}
      <div className="container-custom text-center mb-10 sm:mb-12 md:mb-16 lg:mb-24">
        <h2 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-heading font-black text-black mb-4 tracking-tighter">
          Produk Unggulan
        </h2>
      </div>

      {/* Grid Products dengan aspect ratio berbeda */}
      <div className="container-custom">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
          {featuredProducts.map((product, index) => (
            <div
              key={index}
              className={`group transition-all duration-700 ${
                hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Product Card */}
              <div className="relative overflow-hidden">
                {/* Image dengan aspect ratio berbeda untuk variasi tinggi */}
                <div
                  className={`relative w-full ${product.aspectRatio} overflow-hidden bg-gray-100 mb-4 rounded-lg`}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-black mb-1 sm:mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl font-heading font-semibold text-gray-600">
                    {product.price}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="container-custom text-center mt-16 sm:mt-24">
        <Button
          onClick={handleButtonClick}
          variant="primary"
          size="lg"
          className="bg-black hover:bg-gray-900 text-white font-semibold px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg md:text-xl transition-all duration-300 rounded-full"
        >
          Lihat Semua Produk
        </Button>
      </div>
    </Section>
  )
}

export default FeaturedProducts
