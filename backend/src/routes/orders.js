import express from 'express'
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orderController.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// All order routes require authentication
router.use(authenticate)

router.post('/', createOrder)
router.get('/', getOrders)
router.get('/:id', getOrderById)
router.put('/:id/status', adminOnly, updateOrderStatus)

export default router

