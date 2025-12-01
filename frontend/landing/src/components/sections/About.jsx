import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Section from '../common/Section'

/**
 * About section - Nike style: Simple, to the point, banyak whitespace
 */
function About() {
  const [ref, hasIntersected] = useIntersectionObserver()

  return (
    <Section id="about" alternate ref={ref} className="bg-gray-50 py-24 sm:py-32">
      {/* Section Header - Minimalis */}
      <div className="container-custom text-center mb-10 sm:mb-16 md:mb-20 lg:mb-28">
        <h2 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px] font-heading font-black text-black mb-6 sm:mb-8 tracking-tighter">
          Tentang Kami
        </h2>
      </div>

      {/* Content - Simple dan Clean */}
      <div className="container-custom max-w-4xl mx-auto">
        <div
          className={`space-y-6 sm:space-y-8 transition-all duration-700 ${
            hasIntersected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Main Text */}
          <div className="text-center space-y-4 sm:space-y-6">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-body font-light text-gray-700 leading-relaxed">
              <strong className="font-semibold text-black">Toko Usaha Anda</strong> adalah toko
              terpercaya yang menyediakan berbagai kebutuhan alat rumah tangga, perkakas tukang, dan
              alat motor dengan kualitas terbaik dan harga terjangkau.
            </p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-body font-light text-gray-600 leading-relaxed">
              Dengan pengalaman 15+ tahun melayani ribuan pelanggan, kami berkomitmen untuk
              memberikan produk berkualitas dan layanan terbaik.
            </p>
          </div>

          {/* Stats - Simple Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 md:gap-8 lg:gap-12 mt-10 sm:mt-12 md:mt-16 lg:mt-24 pt-10 sm:pt-12 md:pt-16 lg:pt-24 border-t border-gray-200">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-black mb-1 sm:mb-2">
                15+
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 font-body uppercase tracking-wider">
                Tahun
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-black mb-1 sm:mb-2">
                5K+
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 font-body uppercase tracking-wider">
                Pelanggan
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-black mb-1 sm:mb-2">
                1K+
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 font-body uppercase tracking-wider">
                Produk
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default About
