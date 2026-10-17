import { useState, useEffect } from 'react'
import { useScroll } from '../../hooks/useScroll'
import { useActiveSection } from '../../hooks/useActiveSection'
import { NAVIGATION_ITEMS } from '../../utils/constants'
import { scrollToElement } from '../../utils/scroll'
import { Menu, X } from 'lucide-react'

function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrolled } = useScroll(50)
  const activeSection = useActiveSection(
    NAVIGATION_ITEMS.map(item => item.id),
    100
  )

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const elementId = href.replace('#', '')
      scrollToElement(elementId)
      setIsMobileMenuOpen(false)
    } else {
      setIsMobileMenuOpen(false)
    }
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
          : 'bg-white/95 backdrop-blur-md border-b border-griya-outline/20'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 lg:px-16">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-1">
            <a href="#home" onClick={e => handleNavClick(e, '#home')} className="inline-block">
              <span className="text-xl md:text-xl font-serif text-griya-primary tracking-[0.15em] uppercase font-semibold block">
                Toko Usaha Anda
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center">
            <ul className="flex items-center gap-10">
              {NAVIGATION_ITEMS.map(item => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={e => handleNavClick(e, item.href)}
                    className={`text-[13px] font-sans tracking-wider uppercase transition-colors duration-300 ${
                      activeSection === item.id
                        ? 'text-griya-secondary font-medium'
                        : 'text-griya-primary/70 hover:text-griya-secondary'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Icons Right */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-6 text-griya-primary">
            {/* Icons removed as per request */}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-griya-primary p-1"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} strokeWidth={1.5} />
              ) : (
                <Menu size={24} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-6 border-t border-griya-outline/20">
            <ul className="flex flex-col gap-6 text-center">
              {NAVIGATION_ITEMS.map(item => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={e => handleNavClick(e, item.href)}
                    className={`block text-[13px] font-sans tracking-widest uppercase ${
                      activeSection === item.id
                        ? 'text-griya-secondary font-medium'
                        : 'text-griya-primary/70'
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              {/* Mobile Search/Cart removed */}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
