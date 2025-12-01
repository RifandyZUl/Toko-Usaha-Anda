import express from 'express'
import {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/', getProducts)
router.get('/categories', getCategories)
router.get('/:id', getProductById)

// Admin routes
router.post('/', authenticate, adminOnly, createProduct)
router.put('/:id', authenticate, adminOnly, updateProduct)
router.delete('/:id', authenticate, adminOnly, deleteProduct)

export default router

