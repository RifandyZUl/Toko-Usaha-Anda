import prisma from '../config/database.js'
import {
  sendOtpToWhatsApp,
  verifyOtpCode,
  isPhoneNumberVerified,
  sendEmailVerificationOtp,
  verifyEmailVerificationOtp,
} from '../services/otpService.js'

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
    const status = err.statusCode || 500
    const message = err.message || 'Gagal mengirim kode OTP WhatsApp. Silakan coba beberapa saat lagi.'
    return res.status(status).json({ error: message })
  }
}

/**
 * Verify OTP entered by customer for WhatsApp
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
          data: {
            phone,
            isPhoneVerified: true,
            phoneVerifiedAt: new Date(),
          },
        })
      } catch (dbErr) {
        console.warn('Could not update user phone in DB:', dbErr.message)
      }
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('Error verifying WhatsApp OTP:', err)
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

/**
 * Send OTP to customer's Email (for registration verification)
 */
export async function sendEmailOtp(req, res) {
  try {
    const { email } = req.body
    const cleanEmail = (email || '').trim().toLowerCase()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Alamat email tidak valid.' })
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existing) {
      return res.status(409).json({ error: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.' })
    }

    const result = await sendEmailVerificationOtp(cleanEmail)
    return res.status(200).json(result)
  } catch (err) {
    const status = err.statusCode || 500
    const message = err.message || 'Gagal mengirim kode OTP ke email. Silakan coba lagi.'
    return res.status(status).json({ error: message })
  }
}

/**
 * Verify OTP entered by customer for Email verification
 */
export async function verifyEmailOtp(req, res) {
  try {
    const { email, otp } = req.body
    const cleanEmail = (email || '').trim().toLowerCase()

    if (!cleanEmail || !otp) {
      return res.status(400).json({ error: 'Email dan kode OTP wajib diisi.' })
    }

    const result = await verifyEmailVerificationOtp(cleanEmail, otp)
    if (!result.success) {
      return res.status(400).json({ error: result.message })
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('Error verifying Email OTP:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan saat memverifikasi kode OTP email.' })
  }
}
