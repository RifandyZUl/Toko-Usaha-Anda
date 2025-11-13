import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import { STATS } from '../../utils/constants'
import Button from '../common/Button'
import { scrollToElement } from '../../utils/scroll'
import heroBg from '../../assets/hero-bgg.png'

/**
 * Hero section component dengan background image dan design professional
 * Seperti company profile perusahaan besar
 */
function Hero() {
  const [ref, isIntersecting] = useIntersectionObserver()

  const handleButtonClick = (elementId) => {
    scrollToElement(elementId)
  }

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex items-center justify-center pt-16 sm:pt-20 overflow-hidden"
    >
      {/* Background Image - Full Screen dengan img element untuk reliability */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={heroBg} 
          alt="Toko 3 Macam 10.000" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-out hover:scale-110"
          loading="eager"
        />
        {/* Dark Overlay untuk readability - blur dikurangi lagi */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/25 via-gray-900/15 to-gray-900/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/35 via-gray-900/20 to-transparent" />
        
        {/* Animated gradient overlay untuk efek profesional */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 via-transparent to-primary-600/5 animate-gradient opacity-50" />
      </div>

      {/* Content - Center Aligned seperti company profile besar dengan animasi */}
      <div className="container-custom relative z-10 py-12 sm:py-16 md:py-20 lg:py-28 xl:py-32">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6">
          {/* Main Heading - Poppins Bold dengan animasi slide-up */}
          <h1
            className={`text-[36px] sm:text-[42px] md:text-[56px] lg:text-[64px] xl:text-[72px] font-heading font-bold text-white mb-6 sm:mb-8 transition-all duration-1000 ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 200%' }}>
              Toko Usaha Anda
            </span>
            <span
              className={`block text-white mt-2 sm:mt-4 text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[48px] font-heading font-semibold transition-all duration-1000 ${
                isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              Toko Lengkap Kebutuhan Anda
            </span>
          </h1>
          
          {/* Description - Inter Regular dengan animasi fade-in */}
          <p
            className={`text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px] text-gray-200 max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4 font-body font-normal leading-relaxed transition-all duration-1000 ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '800ms' }}
          >
            Temukan berbagai alat rumah tangga, perkakas tukang, dan alat
            motor dengan kualitas terbaik dan harga terjangkau.
          </p>
          <p
            className={`text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] xl:text-[22px] text-white font-body font-semibold mb-8 sm:mb-10 md:mb-12 transition-all duration-1000 ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '1000ms' }}
          >
            Satu toko untuk semua kebutuhan Anda!
          </p>

          {/* CTA Buttons - Professional Style dengan animasi */}
          <div
            className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4 mb-10 sm:mb-12 md:mb-16 transition-all duration-1000 ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '1100ms' }}
          >
            <Button
              onClick={() => handleButtonClick('products')}
              variant="primary"
              size="md"
              className="shadow-lg text-[14px] sm:text-[15px] px-6 sm:px-7 py-2 sm:py-2.5 font-semibold hover:scale-105 transition-transform duration-300 w-full sm:w-auto"
            >
              Lihat Produk
            </Button>
            <Button
              onClick={() => handleButtonClick('contact')}
              variant="glass"
              size="md"
              className="text-[14px] sm:text-[15px] px-6 sm:px-7 py-2 sm:py-2.5 font-semibold shadow-md hover:scale-105 transition-transform duration-300 w-full sm:w-auto"
            >
              Hubungi Kami
            </Button>
          </div>

          {/* Stats - Professional Layout dengan separator dan animasi stagger */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 pt-8 sm:pt-10 md:pt-12 border-t-2 border-white/30 max-w-3xl mx-auto px-2 sm:px-4">
            {STATS.map((stat, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-1000 ${
                  isIntersecting ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                }`}
                style={{ transitionDelay: `${1200 + index * 150}ms` }}
              >
                <div className="text-[28px] sm:text-[32px] md:text-[40px] lg:text-[48px] xl:text-[56px] font-heading font-bold text-white mb-1 sm:mb-2 animate-pulse">
                  {stat.number}
                </div>
                <div className="text-[11px] sm:text-[12px] md:text-[14px] lg:text-[16px] xl:text-[18px] text-gray-300 font-body font-medium uppercase tracking-wider leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Elegant dengan animasi */}
      <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/50 rounded-full flex justify-center p-1.5 sm:p-2 backdrop-blur-sm bg-white/10 animate-bounce">
          <div className="w-1 h-2 sm:w-1.5 sm:h-3 bg-white/80 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Smooth Transition to Next Section */}
      <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 md:h-40 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
    </section>
  )
}

export default Hero
