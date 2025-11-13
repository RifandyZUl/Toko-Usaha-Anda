import { useState, useEffect } from 'react'
import { useScroll } from '../../hooks/useScroll'
import Icon from './Icon'
import { scrollToTop } from '../../utils/scroll'

/**
 * Scroll to top button component dengan design modern
 */
export function ScrollToTop() {
  const { scrolled } = useScroll(300)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(scrolled)
  }, [scrolled])

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group"
      aria-label="Scroll to top"
    >
      <Icon name="ChevronUp" size={24} className="group-hover:-translate-y-1 transition-transform" />
    </button>
  )
}
