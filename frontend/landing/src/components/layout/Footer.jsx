import { FOOTER_LINKS } from '../../utils/constants'
import { scrollToElement } from '../../utils/scroll'

/**
 * Footer component - Nike style: Simple, clean dengan background hitam
 */
function Footer() {
  const handleLinkClick = (e, href) => {
    e.preventDefault()
    const elementId = href.replace('#', '')
    scrollToElement(elementId)
  }

  return (
    <footer className="bg-black text-white">
      <div className="container-custom py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12 px-4 sm:px-0">
          {/* About Toko Section - Left */}
          <div>
            <h4 className="text-xl sm:text-2xl md:text-3xl font-logo font-normal mb-4 sm:mb-6 text-white tracking-normal">
              Toko Usaha Anda
            </h4>
            <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 font-body leading-relaxed">
              Toko terpercaya yang menawarkan berbagai kebutuhan alat rumah tangga, perkakas tukang, dan alat motor dengan kualitas terbaik.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-base sm:text-lg font-heading font-semibold mb-4 sm:mb-6 text-white">Perusahaan</h4>
            <ul className="flex flex-col gap-3 sm:gap-4">
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleLinkClick(e, '#about')}
                  className="text-base sm:text-lg text-gray-400 hover:text-white transition-colors duration-200 font-body"
                >
                  Tentang Kami
                </a>
              </li>
              <li>
                <a
                  href="#products"
                  onClick={(e) => handleLinkClick(e, '#products')}
                  className="text-base sm:text-lg text-gray-400 hover:text-white transition-colors duration-200 font-body"
                >
                  Produk
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleLinkClick(e, '#contact')}
                  className="text-base sm:text-lg text-gray-400 hover:text-white transition-colors duration-200 font-body"
                >
                  Kontak
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg font-heading font-semibold mb-4 sm:mb-6 text-white">Tautan Cepat</h4>
            <ul className="flex flex-col gap-3 sm:gap-4">
              {FOOTER_LINKS.information.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-base sm:text-lg text-gray-400 hover:text-white transition-colors duration-200 font-body"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Google Maps - Pojok Kanan */}
          <div>
            <h4 className="text-base sm:text-lg font-heading font-semibold mb-4 sm:mb-6 text-white">
              Lokasi Kami
            </h4>
            <a
              href="https://maps.app.goo.gl/gtKvAfVL9Ss7urfD6"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-[200px] sm:h-[250px] rounded-lg overflow-hidden border border-gray-800 shadow-lg relative group bg-gradient-to-br from-gray-900 via-gray-800 to-black hover:from-gray-800 hover:via-gray-700 hover:to-gray-900 transition-all duration-300"
            >
              {/* Google Maps Preview Card */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20 group-hover:bg-white/20 group-hover:border-white/40 transition-all duration-300 group-hover:scale-110">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <p className="text-white text-base sm:text-lg font-semibold mb-2 group-hover:text-white transition-colors">
                    Lihat Lokasi Kami
                  </p>
                  <p className="text-white/70 text-xs sm:text-sm group-hover:text-white/90 transition-colors">
                    Klik untuk membuka di Google Maps
                  </p>
                </div>
              </div>
              
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full blur-2xl"></div>
              </div>
            </a>
            <a
              href="https://maps.app.goo.gl/gtKvAfVL9Ss7urfD6"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm sm:text-base text-gray-400 hover:text-white transition-colors duration-200 font-body underline"
            >
              Buka di Google Maps →
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-900 pt-8 sm:pt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-sm sm:text-base text-gray-400 font-body text-center sm:text-left">
              &copy; {new Date().getFullYear()} Toko Usaha Anda. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm sm:text-base text-gray-400 font-body">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
