/**
 * Order Routes
 * All routes require authentication; status updates are admin-only
 */

import express from 'express'
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrderTracking,
  updateOrderStatus,
  cancelOrder,
  completeOrder,
  rejectCodOrder,
  createOrderDispute,
  resolveOrderDispute,
  createOrderReview,
  checkCodEligibility,
} from '../controllers/orderController.js'
import { authenticate, adminOnly } from '../middleware/auth.js'
import { checkIdempotency } from '../middleware/idempotency.js'
import {
  validateCreateOrder,
  validateOrderStatus,
  validatePagination,
  validateUuidParam,
} from '../middleware/validate.js'

const router = express.Router()

// All order routes require a valid JWT
router.use(authenticate)

router.post('/', checkIdempotency, validateCreateOrder, createOrder)
router.get('/cod-eligibility', checkCodEligibility)
router.post('/:id/cancel', validateUuidParam('id'), cancelOrder)
router.post('/:id/complete', validateUuidParam('id'), completeOrder)
router.post('/:id/reject-cod', adminOnly, validateUuidParam('id'), rejectCodOrder)
router.post('/:id/dispute', validateUuidParam('id'), createOrderDispute)
router.post('/:id/resolve-dispute', adminOnly, validateUuidParam('id'), resolveOrderDispute)
router.post('/:id/review', validateUuidParam('id'), createOrderReview)
router.get('/', validatePagination, getOrders)
router.get('/:id', validateUuidParam('id'), getOrderById)
router.get('/:id/tracking', validateUuidParam('id'), getOrderTracking)
router.put('/:id/status', adminOnly, validateOrderStatus, updateOrderStatus)

export default router
