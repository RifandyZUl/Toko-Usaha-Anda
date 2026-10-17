import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook untuk intersection observer
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} [ref, isIntersecting]
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef(null)

  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', root = null } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [threshold, rootMargin, root, hasIntersected])

  return [ref, isIntersecting, hasIntersected]
}

