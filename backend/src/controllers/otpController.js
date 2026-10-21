import prisma from '../config/database.js'
import { sendOtpToWhatsApp, verifyOtpCode, isPhoneNumberVerified } from '../services/otpService.js'

/**
 * Send OTP via WhatsApp
 */
export async function sendOtp(req, res) {
  try {
    const { phone } = req.body
    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({ error: 'Nomor telepon/WhatsApp wajib diisi minimal 8 digit.' })
    }

    const result = await sendOtpToWhatsApp(phone)
    return res.status(200).json(result)
  } catch (err) {
    console.error('Error sending OTP:', err)
    return res.status(500).json({ error: 'Gagal mengirim kode OTP. Silakan coba beberapa saat lagi.' })
  }
}

/**
 * Verify OTP entered by customer
 */
export async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Nomor telepon dan kode OTP wajib diisi.' })
    }

    const result = verifyOtpCode(phone, otp)
    if (!result.success) {
      return res.status(400).json({ error: result.message })
    }

    // If authenticated, also sync verified phone to user record in DB
    if (req.userId) {
      try {
        await prisma.user.update({
          where: { id: req.userId },
          data: { phone },
        })
      } catch (dbErr) {
        console.warn('Could not update user phone in DB:', dbErr.message)
      }
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('Error verifying OTP:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan saat memverifikasi OTP.' })
  }
}

/**
 * Check if a phone number is currently verified
 */
export async function checkPhoneStatus(req, res) {
  const phone = req.query.phone || ''
  const verified = isPhoneNumberVerified(phone)
  return res.status(200).json({ verified })
}
