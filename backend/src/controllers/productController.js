import prisma from '../config/database.js'
import { validateProduct } from '../utils/validators.js'

/**
 * Get all products
 */
export const getProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {
      isActive: true,
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get product by ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json({ product })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })

    res.json({ categories })
  } catch (error) {
    next(error)
  }
}

/**
 * Create product (Admin only)
 */
export const createProduct = async (req, res, next) => {
  try {
    const validation = validateProduct(req.body)
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors })
    }

    const product = await prisma.product.create({
      data: req.body,
      include: {
        category: true,
      },
    })

    res.status(201).json({
      message: 'Product created successfully',
      product,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update product (Admin only)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
      include: {
        category: true,
      },
    })

    res.json({
      message: 'Product updated successfully',
      product,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete product (Admin only)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.product.delete({
      where: { id },
    })

    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    next(error)
  }
}

