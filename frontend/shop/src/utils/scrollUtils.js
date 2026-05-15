/**
 * Scroll Utility Functions
 * Handles smooth scrolling to elements
 */

/**
 * Scroll to products section smoothly
 * @param {number} delay - Delay in milliseconds before scrolling
 */
export const scrollToProducts = (delay = 100) => {
  setTimeout(() => {
    const productsSection = document.querySelector('.products-section')
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, delay)
}

/**
 * Scroll to top of page smoothly
 */
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

