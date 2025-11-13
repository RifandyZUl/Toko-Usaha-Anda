import { useState, useEffect } from 'react'
import { useScroll } from '../../hooks/useScroll'
import { useActiveSection } from '../../hooks/useActiveSection'
import { NAVIGATION_ITEMS } from '../../utils/constants'
import { scrollToElement } from '../../utils/scroll'

/**
 * Navigation component dengan mobile menu dan design modern
 */
function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrolled, isVisible } = useScroll(50)
  const activeSection = useActiveSection(
    NAVIGATION_ITEMS.map((item) => item.id),
    100
  )

  // Close mobile menu when clicking on a link
  const handleNavClick = (e, href) => {
    e.preventDefault()
    const elementId = href.replace('#', '')
    scrollToElement(elementId)
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible
          ? 'translate-y-0'
          : '-translate-y-full'
      } ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-md border-b border-gray-100/50'
          : 'bg-white/70 backdrop-blur-lg'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Compact & Modern */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center gap-2 sm:gap-2.5 group"
          >
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-heading font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent leading-tight">
                Toko Usaha Anda
              </h1>
              <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 hidden sm:block font-body leading-tight">
                Lengkap & Terpercaya
              </span>
            </div>
          </a>

          {/* Desktop Navigation - Modern & Sleek */}
          <ul className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAVIGATION_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-body font-medium transition-all duration-300 rounded-lg group ${
                    activeSection === item.id
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                  {activeSection === item.id && (
                    <span className="absolute inset-0 bg-primary-50 rounded-lg -z-0" />
                  )}
                  <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary-600 rounded-full transition-all duration-300 ${
                    activeSection === item.id ? 'w-6' : 'w-0 group-hover:w-6'
                  }`} />
                </a>
              </li>
            ))}
          </ul>


          {/* Mobile Menu Toggle - Modern */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-all duration-300 hover:bg-gray-100 active:scale-95"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="relative w-5 h-5">
              <span
                className={`absolute top-0 left-0 w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 top-2' : ''
                }`}
              />
              <span
                className={`absolute top-2 left-0 w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute top-4 left-0 w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 top-2' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu - Modern Design */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-80 opacity-100 mt-2 pb-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-lg p-2 sm:p-3">
            <ul className="flex flex-col gap-1">
              {NAVIGATION_ITEMS.map((item, index) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`block px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-body font-medium transition-all duration-300 rounded-lg ${
                      activeSection === item.id
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 active:scale-98'
                    }`}
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
