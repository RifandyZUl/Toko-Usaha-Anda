import { useState, useEffect } from 'react'

/**
 * Custom hook untuk track active section berdasarkan scroll position
 * @param {Array} sectionIds - Array of section IDs to track
 * @param {number} offset - Offset from top for active detection
 * @returns {string} Active section ID
 */
export function useActiveSection(sectionIds = [], offset = 100) {
  const [activeSection, setActiveSection] = useState('')
  const serializedSectionIds = sectionIds.join(',')

  useEffect(() => {
    if (sectionIds.length === 0) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset
      const sections = sectionIds.map((id) => {
        const element = document.getElementById(id)
        if (!element) return null
        return {
          id,
          top: element.offsetTop,
          bottom: element.offsetTop + element.offsetHeight,
        }
      }).filter(Boolean)

      // Find current section
      const current = sections.find(
        (section) => scrollPosition >= section.top && scrollPosition < section.bottom
      )

      if (current) {
        setActiveSection(current.id)
      } else if (scrollPosition < sections[0]?.top) {
        // If scrolled to top, set first section or empty
        setActiveSection(sectionIds[0] || '')
      } else if (scrollPosition >= sections[sections.length - 1]?.bottom) {
        // If scrolled past last section, set last section
        setActiveSection(sectionIds[sectionIds.length - 1] || '')
      }
    }

    // Initial check
    handleScroll()

    // Throttle scroll event
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedSectionIds, offset])

  return activeSection
}

