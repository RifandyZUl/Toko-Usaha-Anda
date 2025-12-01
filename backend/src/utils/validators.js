/**
 * Validation utilities
 */

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,13}$/
  return phoneRegex.test(phone.replace(/[-\s]/g, ''))
}

export const validateRegister = (data) => {
  const errors = {}

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Valid email is required'
  }

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateProduct = (data) => {
  const errors = {}

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Product name is required'
  }

  if (!data.price || data.price <= 0) {
    errors.price = 'Valid price is required'
  }

  if (data.stock === undefined || data.stock < 0) {
    errors.stock = 'Valid stock is required'
  }

  if (!data.categoryId) {
    errors.categoryId = 'Category is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateOrder = (data) => {
  const errors = {}

  if (!data.shippingAddress || data.shippingAddress.trim().length < 10) {
    errors.shippingAddress = 'Shipping address is required (min 10 characters)'
  }

  if (!data.shippingPhone || !validatePhone(data.shippingPhone)) {
    errors.shippingPhone = 'Valid phone number is required'
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = 'Payment method is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

