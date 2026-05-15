/**
 * Validation Utilities
 * Centralized validation functions with consistent error messages
 */

import { VALIDATION, ERROR_MESSAGES } from '../constants/index.js'
import { ValidationError } from './errors.js'

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (email.length < VALIDATION.EMAIL_MIN_LENGTH || email.length > VALIDATION.EMAIL_MAX_LENGTH) {
    return false
  }
  
  return emailRegex.test(email.trim())
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  const cleaned = phone.replace(/[-\s()]/g, '')
  const phoneRegex = /^[0-9]{10,13}$/
  
  return phoneRegex.test(cleaned) && 
         cleaned.length >= VALIDATION.PHONE_MIN_LENGTH && 
         cleaned.length <= VALIDATION.PHONE_MAX_LENGTH
}

/**
 * Validate user registration data
 * @param {Object} data - Registration data
 * @returns {{isValid: boolean, errors: Object}} Validation result
 */
export const validateRegister = (data) => {
  const errors = {}

  // Email validation
  if (!data.email || typeof data.email !== 'string') {
    errors.email = ERROR_MESSAGES.INVALID_EMAIL
  } else if (!validateEmail(data.email)) {
    errors.email = ERROR_MESSAGES.INVALID_EMAIL
  }

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.name = ERROR_MESSAGES.INVALID_NAME
  } else {
    const trimmedName = data.name.trim()
    if (trimmedName.length < VALIDATION.NAME_MIN_LENGTH) {
      errors.name = ERROR_MESSAGES.INVALID_NAME
    } else if (trimmedName.length > VALIDATION.NAME_MAX_LENGTH) {
      errors.name = `Name must not exceed ${VALIDATION.NAME_MAX_LENGTH} characters`
    }
  }

  // Password validation
  if (!data.password || typeof data.password !== 'string') {
    errors.password = ERROR_MESSAGES.INVALID_PASSWORD
  } else if (data.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.password = ERROR_MESSAGES.INVALID_PASSWORD
  } else if (data.password.length > VALIDATION.PASSWORD_MAX_LENGTH) {
    errors.password = `Password must not exceed ${VALIDATION.PASSWORD_MAX_LENGTH} characters`
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate product data
 * @param {Object} data - Product data
 * @returns {{isValid: boolean, errors: Object}} Validation result
 */
export const validateProduct = (data) => {
  const errors = {}

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.name = ERROR_MESSAGES.PRODUCT_NAME_REQUIRED
  } else {
    const trimmedName = data.name.trim()
    if (trimmedName.length < VALIDATION.PRODUCT_NAME_MIN_LENGTH) {
      errors.name = ERROR_MESSAGES.PRODUCT_NAME_REQUIRED
    } else if (trimmedName.length > VALIDATION.PRODUCT_NAME_MAX_LENGTH) {
      errors.name = `Product name must not exceed ${VALIDATION.PRODUCT_NAME_MAX_LENGTH} characters`
    }
  }

  // Price validation
  const price = parseFloat(data.price)
  if (isNaN(price) || price < VALIDATION.PRICE_MIN) {
    errors.price = ERROR_MESSAGES.PRODUCT_PRICE_REQUIRED
  } else if (price > VALIDATION.PRICE_MAX) {
    errors.price = `Price must not exceed ${VALIDATION.PRICE_MAX}`
  }

  // Stock validation
  const stock = parseInt(data.stock)
  if (isNaN(stock) || stock < VALIDATION.STOCK_MIN) {
    errors.stock = 'Valid stock is required (minimum 0)'
  } else if (stock > VALIDATION.STOCK_MAX) {
    errors.stock = `Stock must not exceed ${VALIDATION.STOCK_MAX}`
  }

  // Category validation
  if (!data.categoryId || typeof data.categoryId !== 'string') {
    errors.categoryId = ERROR_MESSAGES.PRODUCT_CATEGORY_REQUIRED
  }

  // Description validation (optional)
  if (data.description && typeof data.description === 'string') {
    if (data.description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must not exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate order data
 * @param {Object} data - Order data
 * @returns {{isValid: boolean, errors: Object}} Validation result
 */
export const validateOrder = (data) => {
  const errors = {}

  // Shipping address validation
  if (!data.shippingAddress || typeof data.shippingAddress !== 'string') {
    errors.shippingAddress = 'Shipping address is required'
  } else {
    const trimmedAddress = data.shippingAddress.trim()
    if (trimmedAddress.length < VALIDATION.ADDRESS_MIN_LENGTH) {
      errors.shippingAddress = `Shipping address must be at least ${VALIDATION.ADDRESS_MIN_LENGTH} characters`
    } else if (trimmedAddress.length > VALIDATION.ADDRESS_MAX_LENGTH) {
      errors.shippingAddress = `Shipping address must not exceed ${VALIDATION.ADDRESS_MAX_LENGTH} characters`
    }
  }

  // Shipping phone validation
  if (!data.shippingPhone || typeof data.shippingPhone !== 'string') {
    errors.shippingPhone = ERROR_MESSAGES.INVALID_PHONE
  } else if (!validatePhone(data.shippingPhone)) {
    errors.shippingPhone = ERROR_MESSAGES.INVALID_PHONE
  }

  // Payment method validation
  if (!data.paymentMethod || typeof data.paymentMethod !== 'string') {
    errors.paymentMethod = 'Payment method is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

