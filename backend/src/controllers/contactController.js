import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS } from '../constants/index.js'
import * as contactService from '../services/contactService.js'

/**
 * Public handler for submitting a contact message
 */
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, comment } = req.body
  const message = await contactService.createContactMessage({
    name,
    email,
    phone,
    comment,
  })

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Pesan Anda telah berhasil diterima. Tim Toko Usaha Anda akan segera menghubungi Anda.',
    data: {
      id: message.id,
      createdAt: message.createdAt,
    },
  })
})

/**
 * Admin handler for listing all contact messages
 */
export const listContacts = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query
  const result = await contactService.getContactMessages({ page, limit, status })

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  })
})

/**
 * Admin handler for updating message status (READ/ARCHIVED)
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const updated = await contactService.updateContactStatus(id, status)

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Status pesan berhasil diperbarui',
    contact: updated,
  })
})
