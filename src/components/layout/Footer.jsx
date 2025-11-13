import { FOOTER_LINKS, SOCIAL_LINKS } from '../../utils/constants'
import Icon from '../common/Icon'
import { scrollToElement } from '../../utils/scroll'

/**
 * Footer component dengan design modern seperti tisoo.id
 */
function Footer() {
  const handleLinkClick = (e, href) => {
    e.preventDefault()
    const elementId = href.replace('#', '')
    scrollToElement(elementId)
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-12 mb-8 sm:mb-10">
          {/* About Toko Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-base sm:text-lg font-heading font-semibold mb-3 sm:mb-4 text-white">
              Toko Usaha Anda
            </h4>
            <p className="text-sm sm:text-body-md text-gray-300 mb-4 sm:mb-6 font-body leading-relaxed">
              Toko Usaha Anda adalah toko terpercaya yang menawarkan berbagai kebutuhan alat rumah tangga, perkakas tukang, dan alat motor dengan kualitas terbaik dan harga terjangkau. Melayani dengan sepenuh hati sejak 2004.
            </p>

            {/* Social Media */}
            <div className="flex gap-2 sm:gap-3">
              {SOCIAL_LINKS.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border border-gray-700 hover:border-primary-500"
                  aria-label={social.label}
                >
                  <Icon name={social.icon} size={18} className="text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links - Column 1 */}
          <div>
            <h4 className="text-sm sm:text-body-md font-heading font-semibold mb-3 sm:mb-4 text-white">Navigasi</h4>
            <ul className="flex flex-col gap-2 sm:gap-3">
              {FOOTER_LINKS.categories.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-body-md text-gray-400 hover:text-white transition-colors duration-200 font-body"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Links - Column 2 */}
          <div>
            <h4 className="text-sm sm:text-body-md font-heading font-semibold mb-3 sm:mb-4 text-white">Informasi</h4>
            <ul className="flex flex-col gap-2 sm:gap-3">
              {FOOTER_LINKS.information.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-body-md text-gray-400 hover:text-white transition-colors duration-200 font-body"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm sm:text-body-md font-heading font-semibold mb-3 sm:mb-4 text-white">Kontak</h4>
            
            {/* Address */}
            <div className="mb-4 sm:mb-6">
              <h5 className="text-xs sm:text-body-sm font-heading font-semibold mb-1 sm:mb-2 text-white">Toko Usaha Anda</h5>
              <p className="text-xs sm:text-body-sm text-gray-400 font-body leading-relaxed">
                Jl. KH. Mas Mansyur No. 90<br />
                RT 001/RW 010, Kunciran Indah<br />
                Kec. Pinang, Kota Tangerang<br />
                Banten 15144
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-body-sm font-body">
              <p className="text-gray-400">
                <span className="text-gray-500">Telepon: </span>
                <a href="tel:+6281318804267" className="text-white hover:text-primary-400 transition-colors">
                  (+62) 813-1880-4267
                </a>
              </p>
              <p className="text-gray-400">
                <span className="text-gray-500">Email: </span>
                <a href="mailto:info@3macam10000.com" className="text-white hover:text-primary-400 transition-colors break-all">
                  info@3macam10000.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-body-sm text-gray-400 font-body text-center sm:text-left">
              &copy; {new Date().getFullYear()} 3 Macam 10.000. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="#contact"
                onClick={(e) => handleLinkClick(e, '#contact')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-xs sm:text-body-sm font-semibold font-body"
              >
                Hubungi Kami
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
