/**
 * Product Service
 * Handles business logic and data access for products
 */

import prisma from '../config/database.js'
import { transformProduct, transformProducts } from '../utils/productUtils.js'
import { PAGINATION, ERROR_MESSAGES } from '../constants/index.js'
import { NotFoundError, ConflictError } from '../utils/errors.js'

class ProductService {
  /**
   * Get all products with filters and pagination
   */
  async getAllProducts({ category, search, page, limit, isAdmin = false }) {
    const pageNum = Math.max(1, parseInt(page) || PAGINATION.DEFAULT_PAGE)
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT))
    const skip = (pageNum - 1) * limitNum

    const conditions = []
    if (!isAdmin) {
      conditions.push({ isActive: true })
    }
    if (category) {
      conditions.push({
        OR: [
          { categoryId: category },
          { category: { slug: category } },
        ],
      })
    }
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    const transformedProducts = await transformProducts(products)

    return {
      products: transformedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    }
  }

  /**
   * Get featured products (prioritizing most ordered / best selling, then newest)
   */
  async getFeaturedProducts(limit = 4) {
    const limitNum = Math.min(20, Math.max(1, parseInt(limit) || 4))

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy: [
        {
          orderItems: {
            _count: 'desc',
          },
        },
        { createdAt: 'desc' },
      ],
      take: limitNum,
    })

    const transformedProducts = await transformProducts(products)

    return transformedProducts.map((p, idx) => ({
      ...p,
      badge: (p._count?.orderItems > 0 || idx === 0) ? 'Terlaris' : (idx === 1 ? 'Populer' : null),
    }))
  }

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product) {
      throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND)
    }

    return transformProduct(product)
  }

  /**
   * Create new product
   */
  async createProduct(data) {
    if (!data.slug && data.name) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    }

    if (data.slug) {
      const existing = await prisma.product.findUnique({ where: { slug: data.slug } })
      if (existing) throw new ConflictError(ERROR_MESSAGES.PRODUCT_SLUG_EXISTS)
    }

    const product = await prisma.product.create({
      data,
      include: { category: true },
    })

    return transformProduct(product)
  }

  /**
   * Update existing product
   */
  async updateProduct(id, data) {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND)

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug: data.slug } })
      if (slugExists) throw new ConflictError(ERROR_MESSAGES.PRODUCT_SLUG_EXISTS)
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    })

    return transformProduct(product)
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND)

    return prisma.product.delete({ where: { id } })
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
  }
}

export default new ProductService()
