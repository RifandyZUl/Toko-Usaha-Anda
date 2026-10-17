import { useEffect, useState } from 'react'
import { SHOP_URL, CONTACT_WHATSAPP } from '../../utils/constants'
import heroBg from '../../assets/bg.png'

function Hero() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section
      id="home"
      className="relative h-screen min-h-[600px] flex items-center overflow-hidden bg-griya-bg pt-20"
    >
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <img
          src={heroBg}
          alt="Toko Usaha Anda"
          className={`w-full h-full object-cover transition-transform duration-[15000ms] ease-out ${
            isLoaded ? 'scale-100' : 'scale-105'
          }`}
          loading="eager"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="max-w-3xl text-white">
          <h1
            className={`font-serif text-[32px] sm:text-[40px] md:text-[52px] lg:text-[60px] font-medium mb-4 md:mb-6 leading-[1.2] tracking-normal transition-all duration-1000 transform ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            Solusi Lengkap untuk Rumah & Kebutuhan Anda
          </h1>
          <p
            className={`font-sans text-[14px] md:text-[16px] mb-6 md:mb-8 text-white/90 max-w-2xl leading-relaxed font-light transition-all duration-1000 transform ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '500ms' }}
          >
            Kami menyediakan berbagai pilihan Kebutuhan rumah tangga, Peralatan tukang & aksesoris
            motor dengan kualitas yang terjamin dan harga terjangkau.
          </p>
          <div
            className={`flex flex-wrap gap-4 transition-all duration-1000 transform ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '800ms' }}
          >
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-griya-secondary text-white px-6 md:px-8 py-3 md:py-3.5 font-sans font-medium text-[13px] tracking-wider uppercase hover:bg-[#b09268] transition-colors duration-300"
            >
              Lihat Produk
            </a>
            <a
              href={`https://wa.me/${CONTACT_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border border-white text-white px-6 md:px-8 py-3 md:py-3.5 font-sans font-medium text-[13px] tracking-wider uppercase hover:bg-white hover:text-griya-primary transition-colors duration-300"
            >
              Hubungi via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
