/**
 * Validation Utilities
 * Reusable validation functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @returns {boolean} True if value exists
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if valid
 */
export const minLength = (value, minLength) => {
  if (!value) return false
  return value.length >= minLength
}

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
export const numberRange = (value, min, max) => {
  const num = Number(value)
  if (isNaN(num)) return false
  return num >= min && num <= max
}

/**
 * Validate product form data
 * @param {Object} data - Product data
 * @returns {Object} Validation result with isValid and errors
 */
export const validateProduct = (data) => {
  const errors = {}

  if (!isRequired(data.name)) {
    errors.name = 'Nama produk harus diisi'
  }

  const slug = (data.slug || '').trim()
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = 'Slug hanya boleh mengandung huruf kecil, angka, dan tanda hubung'
  }

  if (data.hasVariants) {
    if (!Array.isArray(data.variants) || data.variants.length === 0) {
      errors.variants = 'Minimal harus menambahkan 1 varian produk'
    } else {
      const hasInvalid = data.variants.some(
        v => !v.name || !String(v.name).trim() || isNaN(v.price) || Number(v.price) < 0 || isNaN(v.stock) || Number(v.stock) < 0
      )
      if (hasInvalid) {
        errors.variants = 'Semua varian harus memiliki nama, harga (≥ 0), dan stok (≥ 0) yang valid'
      }
    }
  } else {
    if (!isRequired(data.price)) {
      errors.price = 'Harga harus diisi'
    } else if (!numberRange(data.price, 0, 999999999)) {
      errors.price = 'Harga harus antara 0 dan 999.999.999'
    }

    if (!isRequired(data.stock)) {
      errors.stock = 'Stok harus diisi'
    } else if (!numberRange(data.stock, 0, 999999)) {
      errors.stock = 'Stok harus antara 0 dan 999.999'
    }
  }

  if (!isRequired(data.categoryId)) {
    errors.categoryId = 'Kategori harus dipilih'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

