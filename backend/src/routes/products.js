/**
 * Product Routes
 * Public reads / Admin-only writes — with input validation
 */

import express from 'express'
import {
  getProducts,
  getFeaturedProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'
import { getProductReviews } from '../controllers/orderController.js'
import { authenticate, adminOnly } from '../middleware/auth.js'
import {
  validateProductInput,
  validatePagination,
  validateUuidParam,
} from '../middleware/validate.js'

const router = express.Router()

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/', validatePagination, getProducts)
router.get('/featured', getFeaturedProducts)
router.get('/categories', getCategories)
router.get('/:id', validateUuidParam('id'), getProductById)
router.get('/:id/reviews', validateUuidParam('id'), getProductReviews)

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post('/', authenticate, adminOnly, validateProductInput, createProduct)
router.put('/:id', authenticate, adminOnly, validateUuidParam('id'), validateProductInput, updateProduct)
router.delete('/:id', authenticate, adminOnly, validateUuidParam('id'), deleteProduct)

export default router
