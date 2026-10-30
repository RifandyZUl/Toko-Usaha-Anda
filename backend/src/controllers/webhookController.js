import { processCustomerMessage } from '../services/chatbotService.js'
import { logInfo, logError } from '../utils/logger.js'

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

    logInfo(`Incoming WhatsApp Chatbot Message from ${sender}: "${message}"`)

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
