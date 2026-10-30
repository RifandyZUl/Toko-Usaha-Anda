import express from 'express'
import { authenticate, adminOnly } from '../middleware/auth.js'
import { validateUuidParam } from '../middleware/validate.js'
import { submitContact, listContacts, updateStatus } from '../controllers/contactController.js'

const router = express.Router()

// Public endpoint to submit contact form
router.post('/', submitContact)

// Admin-only endpoints
router.get('/', authenticate, adminOnly, listContacts)
router.patch('/:id/status', authenticate, adminOnly, validateUuidParam('id'), updateStatus)

export default router
