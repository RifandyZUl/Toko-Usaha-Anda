/**
 * Slug Utility Functions
 * Helper functions for generating and validating slugs
 */

/**
 * Generate slug from text
 * Converts text to URL-friendly slug format
 * @param {string} text - Text to convert to slug
 * @returns {string} Generated slug
 */
export const generateSlug = text => {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 100) // Limit to 100 characters
}

/**
 * Validate slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid
 */
export const isValidSlug = slug => {
  if (!slug || typeof slug !== 'string') {
    return false
  }

  // Slug should only contain lowercase letters, numbers, and dashes
  // Should not start or end with dash
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100
}

/**
 * Check if slug needs to be updated
 * Compares current slug with auto-generated slug from name
 * @param {string} currentSlug - Current slug value
 * @param {string} name - Product name
 * @returns {boolean} True if slug should be auto-updated
 */
export const shouldAutoUpdateSlug = (currentSlug, name) => {
  if (!name || !currentSlug) {
    return true
  }

  // Auto-update if current slug is empty or matches the old generated slug
  return !currentSlug || currentSlug === generateSlug(name.split(' ')[0])
}
