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
          variants: {
            where: isAdmin ? { deletedAt: null } : { isActive: true, deletedAt: null },
            orderBy: { price: 'asc' },
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
        variants: {
          where: { isActive: true, deletedAt: null },
          orderBy: { price: 'asc' },
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
      include: {
        category: true,
        variants: {
          where: { isActive: true, deletedAt: null },
          orderBy: { price: 'asc' },
        },
      },
    })

    if (!product) {
      throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND)
    }

    return transformProduct(product)
  }

  /**
   * Create new product (with optional variants)
   */
  async createProduct(data) {
    const { variants, ...productData } = data

    if (!productData.slug && productData.name) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    }

    if (productData.slug) {
      const existing = await prisma.product.findUnique({ where: { slug: productData.slug } })
      if (existing) throw new ConflictError(ERROR_MESSAGES.PRODUCT_SLUG_EXISTS)
    }

    let parsedVariants = []
    if (Array.isArray(variants) && variants.length > 0) {
      parsedVariants = variants
        .filter(v => v && v.name && String(v.name).trim() !== '')
        .map(v => ({
          name: String(v.name).trim(),
          sku: v.sku?.trim() || null,
          price: parseFloat(v.price) || 0,
          stock: isNaN(parseInt(v.stock, 10)) ? 0 : parseInt(v.stock, 10),
          weight: v.weight ? parseInt(v.weight, 10) : null,
          image: v.image || null,
          attributes: v.attributes || null,
          isActive: v.isActive !== false,
        }))

      if (parsedVariants.length > 0) {
        // Auto-calculate total stock and base minimum price
        productData.stock = parsedVariants.reduce((sum, v) => sum + v.stock, 0)
        if (productData.price === undefined || productData.price === null || isNaN(productData.price) || Number(productData.price) === 0) {
          productData.price = Math.min(...parsedVariants.map(v => v.price))
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        ...(parsedVariants.length > 0 && {
          variants: {
            create: parsedVariants,
          },
        }),
      },
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' },
        },
      },
    })

    return transformProduct(product)
  }

  /**
   * Update existing product (with variant sync)
   */
  async updateProduct(id, data) {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    })
    if (!existing) throw new NotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND)

    const { variants, ...productData } = data

    if (productData.slug && productData.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug: productData.slug } })
      if (slugExists) throw new ConflictError(ERROR_MESSAGES.PRODUCT_SLUG_EXISTS)
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(variants)) {
        const parsedVariants = variants
          .filter(v => v && v.name && String(v.name).trim() !== '')
          .map(v => ({
            id: v.id || undefined,
            name: String(v.name).trim(),
            sku: v.sku?.trim() || null,
            price: parseFloat(v.price) || 0,
            stock: isNaN(parseInt(v.stock, 10)) ? 0 : parseInt(v.stock, 10),
            weight: v.weight ? parseInt(v.weight, 10) : null,
            image: v.image || null,
            attributes: v.attributes || null,
            isActive: v.isActive !== false,
          }))

        if (parsedVariants.length > 0) {
          productData.stock = parsedVariants.reduce((sum, v) => sum + v.stock, 0)
          if (productData.price === undefined || productData.price === null || isNaN(productData.price) || Number(productData.price) === 0) {
            productData.price = Math.min(...parsedVariants.map(v => v.price))
          }
        }

        const incomingIds = parsedVariants.filter(v => v.id).map(v => v.id)

        // Soft-delete variants that were removed in UI (preserves historical references)
        await tx.productVariant.updateMany({
          where: {
            productId: id,
            id: { notIn: incomingIds },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        })

        // Upsert active variants
        for (const v of parsedVariants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                weight: v.weight,
                image: v.image,
                attributes: v.attributes,
                isActive: v.isActive,
                deletedAt: null,
              },
            })
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name,
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                weight: v.weight,
                image: v.image,
                attributes: v.attributes,
                isActive: v.isActive,
                deletedAt: null,
              },
            })
          }
        }
      }

      return tx.product.update({
        where: { id },
        data: productData,
        include: {
          category: true,
          variants: {
            where: { deletedAt: null },
            orderBy: { price: 'asc' },
          },
        },
      })
    })

    return transformProduct(updated)
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
