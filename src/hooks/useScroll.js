import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook untuk track scroll position dan direction
 * @param {number} threshold - Threshold untuk menentukan scrolled state
 * @returns {Object} Object dengan scrolled state dan isVisible (for hide on scroll down)
 */
export function useScroll(threshold = 50) {
  const [scrolled, setScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const isScrolled = currentScrollY > threshold
      
      setScrolled(isScrolled)

      // Hide nav on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    // Initial check
    handleScroll()

    // Throttle scroll event for performance
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [threshold])

  return { scrolled, isVisible }
}

