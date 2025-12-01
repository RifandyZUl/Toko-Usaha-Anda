import { useState, useEffect } from 'react'
import { useScroll } from '../../hooks/useScroll'
import { useActiveSection } from '../../hooks/useActiveSection'
import { NAVIGATION_ITEMS } from '../../utils/constants'
import { scrollToElement } from '../../utils/scroll'
import Icon from '../common/Icon'

/**
 * Navigation - Nike style: Simple, clean, putih/transparan dengan warna hitam
 */
function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrolled } = useScroll(50)
  const activeSection = useActiveSection(
    NAVIGATION_ITEMS.map((item) => item.id),
    100
  )

  const handleNavClick = (e, href) => {
    e.preventDefault()
    const elementId = href.replace('#', '')
    scrollToElement(elementId)
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-gray-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Unik dan Khas */}
          <a
            href="#home"
            onClick={(e) => handleNavClick(e, '#home')}
            className="flex items-center group"
          >
            <h1 className="text-lg sm:text-xl md:text-2xl font-logo font-normal text-black tracking-normal relative">
              <span className="relative z-10">Toko Usaha Anda</span>
              <span className="absolute inset-0 text-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm">
                Toko Usaha Anda
              </span>
            </h1>
          </a>

          {/* Desktop Navigation - Clean */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              {NAVIGATION_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`text-base sm:text-lg font-body font-medium transition-all duration-300 ${
                      activeSection === item.id
                        ? 'text-black'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-black"
            aria-label="Toggle menu"
          >
            <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-gray-200">
            <ul className="flex flex-col gap-2">
              {NAVIGATION_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`block px-4 py-2 text-sm font-body ${
                      activeSection === item.id
                        ? 'text-black font-semibold'
                        : 'text-gray-600'
                    }`}
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
