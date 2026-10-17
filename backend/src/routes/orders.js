/**
 * Order Routes
 * All routes require authentication; status updates are admin-only
 */

import express from 'express'
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
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
router.post('/:id/cancel', validateUuidParam('id'), cancelOrder)
router.get('/', validatePagination, getOrders)
router.get('/:id', validateUuidParam('id'), getOrderById)
router.put('/:id/status', adminOnly, validateOrderStatus, updateOrderStatus)

export default router
