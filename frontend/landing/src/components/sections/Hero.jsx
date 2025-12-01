import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import Button from '../common/Button'
import { scrollToElement } from '../../utils/scroll'
import heroBg from '../../assets/bgbaru.png'

/**
 * Hero section - Nike style: Gambar jelas seperti hero section pada umumnya
 */
function Hero() {
  const [ref, isIntersecting] = useIntersectionObserver()

  const handleButtonClick = elementId => {
    scrollToElement(elementId)
  }

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex items-center justify-center pt-20 sm:pt-24 overflow-hidden"
    >
      {/* Background Image - Jelas seperti hero section pada umumnya */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroBg}
          alt="Toko Usaha Anda"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Overlay hitam subtle untuk readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content - Nike Style: Minimalis dengan Typography yang lebih kecil */}
      <div className="container-custom relative z-10 py-16 sm:py-24 md:py-32 lg:py-40 xl:py-48">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Heading - Ukuran lebih kecil */}
          <h1
            className={`text-[36px] sm:text-[48px] md:text-[56px] lg:text-[64px] xl:text-[72px] 2xl:text-[80px] font-heading font-black text-white mb-6 sm:mb-8 md:mb-12 leading-[0.9] tracking-tighter transition-all duration-1000 ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '200ms', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            Kualitas
            <br />
            Terpercaya
          </h1>

          {/* Subtitle - Simple dan Clean */}
          <p
            className={`text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] xl:text-[22px] 2xl:text-[24px] text-white/90 max-w-3xl mx-auto mb-6 sm:mb-8 md:mb-12 lg:mb-16 font-body font-light leading-relaxed transition-all duration-1000 ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '400ms', textShadow: '0 1px 10px rgba(0,0,0,0.2)' }}
          >
            Alat rumah tangga, perkakas tukang, dan alat motor dengan kualitas terbaik
          </p>

          {/* CTA Button - Simple dan Clean seperti Nike */}
          <div
            className={`transition-all duration-1000 ${
              isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            <Button
              onClick={() => handleButtonClick('products')}
              variant="primary"
              size="lg"
              className="bg-black hover:bg-gray-900 text-white font-semibold px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg md:text-xl transition-all duration-300 rounded-full"
            >
              Mulai Berbelanja
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
