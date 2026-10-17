import express from 'express'
import { handleNotification, simulatePayment } from '../controllers/paymentController.js'
import { authenticate, adminOnly } from '../middleware/auth.js'

const router = express.Router()

// Webhook notification from Midtrans
router.post('/notification', handleNotification)

// Simulate successful payment in development mode (Admin only)
router.post('/simulate', authenticate, adminOnly, simulatePayment)

export default router
