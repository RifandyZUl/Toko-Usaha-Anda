/**
 * Product Controller
 * Handles all product-related API requests
 */

import productService from '../services/productService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../constants/index.js'

/**
 * Get all products
 */
export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAllProducts({
    ...req.query,
    isAdmin: req.user?.role === 'ADMIN'
  })
  res.status(HTTP_STATUS.OK).json(result)
})

/**
 * Get product by ID
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id)
  res.status(HTTP_STATUS.OK).json({ product })
})

/**
 * Get featured products (most purchased / best sellers)
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 4
  const products = await productService.getFeaturedProducts(limit)
  res.status(HTTP_STATUS.OK).json({ products })
})

/**
 * Get all categories
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await productService.getAllCategories()
  res.status(HTTP_STATUS.OK).json({ categories })
})

/**
 * Create product (Admin only)
 */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body)
  res.status(HTTP_STATUS.CREATED).json({
    message: SUCCESS_MESSAGES.PRODUCT_CREATED,
    product
  })
})

/**
 * Update product (Admin only)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body)
  res.status(HTTP_STATUS.OK).json({
    message: SUCCESS_MESSAGES.PRODUCT_UPDATED,
    product
  })
})

/**
 * Delete product (Admin only)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id)
  res.status(HTTP_STATUS.OK).json({
    message: SUCCESS_MESSAGES.PRODUCT_DELETED
  })
})

