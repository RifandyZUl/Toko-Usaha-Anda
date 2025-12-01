import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'
import Button from '../common/Button'
import { scrollToElement } from '../../utils/scroll'

/**
 * About Section - Tentang Toko Usaha Anda
 */
function DiningTable() {
  const [ref, hasIntersected] = useIntersectionObserver()

  const handleButtonClick = () => {
    scrollToElement('products')
  }

  // Gambar untuk section Solusi Kami
  const solutionImage = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&q=80'

  return (
    <Section id="dining-table" alternate ref={ref} className="bg-beige-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Side - Text */}
        <div
          className={`transition-all duration-700 ${
            hasIntersected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}
        >
          <h2 className="text-[36px] sm:text-[42px] md:text-[48px] lg:text-[56px] font-heading font-bold text-brown-900 mb-6">
            Solusi Lengkap untuk Semua Kebutuhan Anda
          </h2>
          <p className="text-base sm:text-lg text-brown-700 mb-4 font-body leading-relaxed">
            <strong className="text-brown-900 font-semibold">Toko Usaha Anda</strong> adalah toko terpercaya yang menyediakan berbagai kebutuhan alat rumah tangga, perkakas tukang, dan alat motor dengan kualitas terbaik dan harga yang terjangkau.
          </p>
          <p className="text-base sm:text-lg text-brown-700 mb-8 font-body leading-relaxed">
            Dengan pengalaman bertahun-tahun melayani ribuan pelanggan, kami berkomitmen untuk memberikan produk berkualitas dan layanan terbaik. Visi kami adalah menjadi partner terpercaya untuk semua kebutuhan rumah tangga, konstruksi, dan otomotif Anda.
          </p>
          <Button
            onClick={handleButtonClick}
            variant="primary"
            size="lg"
            className="bg-brown-600 hover:bg-brown-700 text-white font-semibold px-8 py-4 text-lg"
          >
            Lihat Produk
          </Button>
        </div>

        {/* Right Side - Image dengan gambar nyata */}
        <div
          className={`relative transition-all duration-700 ${
            hasIntersected ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={solutionImage}
              alt="Toko Usaha Anda - Solusi Lengkap"
              className="w-full h-full object-cover aspect-[4/3]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown-900/20 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </Section>
  )
}

export default DiningTable
