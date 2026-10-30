import prisma from '../config/database.js'
import { BadRequestError, NotFoundError } from '../utils/errors.js'

/**
 * Service for managing customer contact form submissions
 */
export async function createContactMessage({ name, email, phone, comment }) {
  if (!name || !name.trim()) {
    throw new BadRequestError('Nama wajib diisi.')
  }
  if (!email || !email.trim()) {
    throw new BadRequestError('Email wajib diisi.')
  }
  if (!comment || !comment.trim()) {
    throw new BadRequestError('Pesan atau komentar wajib diisi.')
  }

  const message = await prisma.contactMessage.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      comment: comment.trim(),
    },
  })

  return message
}

export async function getContactMessages({ page = 1, limit = 20, status } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
  const skip = (pageNum - 1) * limitNum

  const where = {}
  if (status && ['UNREAD', 'READ', 'ARCHIVED'].includes(status)) {
    where.status = status
  }

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.contactMessage.count({ where }),
  ])

  return {
    messages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  }
}

export async function updateContactStatus(id, status) {
  if (!['UNREAD', 'READ', 'ARCHIVED'].includes(status)) {
    throw new BadRequestError('Status kontak tidak valid.')
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } })
  if (!existing) {
    throw new NotFoundError('Pesan kontak tidak ditemukan.')
  }

  return prisma.contactMessage.update({
    where: { id },
    data: { status },
  })
}
