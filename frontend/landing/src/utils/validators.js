/**
 * Validasi email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validasi nomor telepon Indonesia
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export function isValidPhone(phone) {
  // Karakter yang diizinkan: angka, spasi, dash, plus, kurung buka/tutup
  // Menggunakan character class dengan dash di akhir (tidak perlu escape)
  const phoneRegex = /^[\d\s+() -]+$/
  const digitsOnly = phone.replace(/\D/g, '')
  return phoneRegex.test(phone) && digitsOnly.length >= 10
}

/**
 * Validasi form contact
 * @param {Object} values - Form values
 * @returns {Object} Errors object
 */
export function validateContactForm(values) {
  const errors = {}

  // Name validation
  if (!values.name || values.name.trim().length < 2) {
    errors.name = 'Nama harus diisi minimal 2 karakter'
  }

  // Email validation
  if (!values.email) {
    errors.email = 'Email harus diisi'
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Email tidak valid'
  }

  // Phone validation
  if (!values.phone) {
    errors.phone = 'Nomor telepon harus diisi'
  } else if (!isValidPhone(values.phone)) {
    errors.phone = 'Nomor telepon tidak valid'
  }

  // Message validation
  if (!values.message || values.message.trim().length < 10) {
    errors.message = 'Pesan harus diisi minimal 10 karakter'
  }

  return errors
}

