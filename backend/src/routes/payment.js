import express from 'express'
import { handleNotification, simulatePayment } from '../controllers/paymentController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Webhook notification from Midtrans
router.post('/notification', handleNotification)

// Simulate successful payment in development mode (Owner or Admin)
router.post('/simulate', authenticate, simulatePayment)

export default router
