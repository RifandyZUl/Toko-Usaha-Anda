import express from 'express'
import { handleFonnteWebhook } from '../controllers/webhookController.js'

const router = express.Router()

/**
 * POST /api/webhook/fonnte
 * Webhook endpoint untuk menerima pesan WhatsApp masuk dari Fonnte
 */
router.post('/fonnte', handleFonnteWebhook)

export default router
