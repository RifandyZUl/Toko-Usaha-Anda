/**
 * Input Validation Middleware
 * Uses express-validator to validate and sanitize incoming request data.
 *
 * Best Practice: Validate at the controller boundary (routes),
 * reject invalid data before it reaches business logic or the database.
 */

import { body, param, query, validationResult } from 'express-validator'
import { HTTP_STATUS } from '../constants/index.js'

// ─── Validation Result Handler ────────────────────────────────────────────────

/**
 * Checks validation results and returns a 400 error if any rules failed.
 * Must be placed AFTER validation rules in the route middleware chain.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    })
  }
  next()
}

// ─── Auth Validators ──────────────────────────────────────────────────────────

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email is too long'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  handleValidationErrors,
]

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 100 }).withMessage('Password is too long'),

  handleValidationErrors,
]

// ─── Product Validators ───────────────────────────────────────────────────────

export const validateProductInput = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters'),

  body('slug')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('price')
    .custom((val, { req }) => {
      const hasVariants = Array.isArray(req.body.variants) && req.body.variants.length > 0
      if (!hasVariants && (val === undefined || val === null || val === '')) {
        throw new Error('Price is required')
      }
      if (val !== undefined && val !== null && val !== '') {
        const num = parseFloat(val)
        if (isNaN(num) || num < 0) {
          throw new Error('Price must be a positive number')
        }
      }
      return true
    }),

  body('stock')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 999999 }).withMessage('Stock must be a non-negative integer'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

  body('categoryId')
    .notEmpty().withMessage('Category is required')
    .isUUID().withMessage('Invalid category ID'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),

  body('variants')
    .optional()
    .isArray().withMessage('Variants must be an array'),

  handleValidationErrors,
]

// ─── Order Validators ─────────────────────────────────────────────────────────

export const validateOrderStatus = [
  param('id')
    .isUUID().withMessage('Invalid order ID'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid order status'),

  handleValidationErrors,
]

export const validateCreateOrder = [
  body('receiverName')
    .trim()
    .notEmpty().withMessage('Nama penerima wajib diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama penerima harus antara 2 sampai 100 karakter')
    .escape(),

  body('shippingPhone')
    .trim()
    .notEmpty().withMessage('Nomor telepon wajib diisi')
    .matches(/^[0-9+\-\s()]+$/).withMessage('Format nomor telepon tidak valid')
    .isLength({ min: 9, max: 20 }).withMessage('Nomor telepon harus antara 9 sampai 20 karakter'),

  body('addressDetail')
    .trim()
    .notEmpty().withMessage('Detail alamat/jalan wajib diisi')
    .isLength({ min: 10, max: 500 }).withMessage('Detail alamat harus antara 10 sampai 500 karakter')
    .escape(),

  body('province')
    .trim()
    .notEmpty().withMessage('Provinsi wajib diisi')
    .escape(),

  body('city')
    .trim()
    .notEmpty().withMessage('Kota/Kabupaten wajib diisi')
    .escape(),

  body('subdistrict')
    .trim()
    .notEmpty().withMessage('Kecamatan wajib diisi')
    .escape(),

  body('kelurahan')
    .trim()
    .notEmpty().withMessage('Kelurahan wajib diisi')
    .escape(),

  body('postalCode')
    .trim()
    .notEmpty().withMessage('Kode pos wajib diisi')
    .isLength({ min: 5, max: 5 }).withMessage('Kode pos harus terdiri dari 5 digit angka')
    .isNumeric().withMessage('Kode pos harus berupa angka'),

  body('latitude')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .escape(),

  body('longitude')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .escape(),

  body('shippingCourier')
    .trim()
    .notEmpty().withMessage('Kurir pengiriman wajib dipilih')
    .isIn(['JNE', 'J&T', 'POS', 'GOSEND']).withMessage('Kurir pengiriman tidak valid'),

  body('shippingFee')
    .notEmpty().withMessage('Biaya pengiriman wajib diisi')
    .isFloat({ min: 0, max: 1000000 }).withMessage('Biaya pengiriman harus berupa angka antara 0 sampai Rp1.000.000')
    .toFloat(),

  body('paymentMethod')
    .notEmpty().withMessage('Metode pembayaran wajib dipilih')
    .isIn([
      'CASH',
      'TRANSFER',
      'COD',
      'MIDTRANS',
      'QRIS',
      'TRANSFER_BCA',
      'TRANSFER_MANDIRI',
      'TRANSFER_BRI',
      'TRANSFER_BNI',
      'TRANSFER_PERMATA',
    ]).withMessage('Metode pembayaran tidak valid'),

  handleValidationErrors,
]

// ─── Profile Validator ────────────────────────────────────────────────────────

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s()]+$/).withMessage('Format nomor telepon tidak valid')
    .isLength({ min: 9, max: 20 }).withMessage('Nomor telepon harus antara 9 sampai 20 karakter'),

  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Alamat maksimal 2000 karakter'),

  handleValidationErrors,
]

// ─── Pagination Validators ────────────────────────────────────────────────────

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term is too long')
    .escape(),

  handleValidationErrors,
]

// ─── UUID Param Validator ─────────────────────────────────────────────────────

export const validateUuidParam = (paramName = 'id') => [
  param(paramName)
    .isUUID().withMessage(`Invalid ${paramName} format`),

  handleValidationErrors,
]
