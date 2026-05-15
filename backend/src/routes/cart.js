import express from 'express'
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js'
import { authenticate } from '../middleware/auth.js'

import {
  validateUuidParam,
  handleValidationErrors,
} from '../middleware/validate.js'
import { body } from 'express-validator'

const router = express.Router()

// All cart routes require authentication
router.use(authenticate)

const validateCartItem = [
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  handleValidationErrors
]

router.get('/', getCart)
router.post('/', validateCartItem, addToCart)
router.put('/:id', validateUuidParam('id'), validateCartItem, updateCartItem)
router.delete('/:id', validateUuidParam('id'), removeFromCart)
router.delete('/', clearCart)

export default router

