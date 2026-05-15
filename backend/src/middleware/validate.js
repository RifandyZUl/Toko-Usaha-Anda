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
    .isLength({ min: 2, max: 200 }).withMessage('Name must be between 2 and 200 characters')
    .escape(),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0, max: 999999999 }).withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0, max: 999999 }).withMessage('Stock must be a non-negative integer'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),

  body('categoryId')
    .notEmpty().withMessage('Category is required')
    .isUUID().withMessage('Invalid category ID'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),

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
  body('shippingAddress')
    .trim()
    .notEmpty().withMessage('Shipping address is required')
    .isLength({ min: 10, max: 500 }).withMessage('Address must be between 10 and 500 characters')
    .escape(),

  body('shippingPhone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/).withMessage('Invalid phone number format')
    .isLength({ min: 9, max: 20 }).withMessage('Phone must be between 9 and 20 characters'),

  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['CASH', 'TRANSFER', 'COD']).withMessage('Invalid payment method'),

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
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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
