import crypto from 'crypto'
import { processCustomerMessage } from '../services/chatbotService.js'
import { logInfo, logError, logWarn, maskPersonal } from '../utils/logger.js'

const sha256 = value => crypto.createHash('sha256').update(String(value)).digest()

/**
 * Fonnte does not sign webhooks, so the webhook URL configured in the Fonnte dashboard
 * must carry ?secret=<FONNTE_WEBHOOK_SECRET>. Without a configured secret only development is allowed.
 */
export function verifyFonnteWebhook(req, res, next) {
  const secret = process.env.FONNTE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV === 'development') return next()
    logWarn('FONNTE_WEBHOOK_SECRET not configured — rejecting Fonnte webhook')
    return res.status(503).json({ error: 'Webhook is not configured.' })
  }

  const provided = typeof req.query.secret === 'string' ? req.query.secret : ''
  if (!crypto.timingSafeEqual(sha256(provided), sha256(secret))) {
    logWarn('Fonnte webhook rejected: invalid secret', { ip: req.ip })
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

/**
 * Handle incoming Webhook from Fonnte WhatsApp Gateway
 */
export async function handleFonnteWebhook(req, res) {
  try {
    const { sender, message, name } = req.body

    // Validasi payload Fonnte
    if (!sender || !message) {
      return res.status(200).json({ status: 'ignored', message: 'No sender or message provided' })
    }

    logInfo('Incoming WhatsApp chatbot message', { sender: maskPersonal(sender), length: String(message).length })

    // Proses pesan dan dapatkan respon yang bersahabat
    const replyText = await processCustomerMessage(sender, message, name)

    // Fonnte otomatis meneruskan 'reply' ini ke WhatsApp pengirim
    return res.status(200).json({
      reply: replyText,
    })
  } catch (err) {
    logError('Error handling Fonnte webhook:', err)
    return res.status(200).json({
      reply: 'Halo Kak! Mohon maaf ya, sistem chatbot kami sedang ada perbaikan sejenak. Kakak bisa hubungi admin kami ya 🙏',
    })
  }
}
