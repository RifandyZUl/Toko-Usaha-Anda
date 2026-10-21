import crypto from 'crypto'

/**
 * Service to manage WhatsApp / SMS OTP generation, delivery, and verification.
 */

// In-memory cache for OTPs and verified phone numbers
const otpCache = new Map()
const verifiedPhoneCache = new Map()

const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes validity
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours validity
const MAX_VERIFY_ATTEMPTS = 5

/**
 * Standardize Indonesian phone numbers to 628... format
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return ''
  let cleaned = phone.replace(/[^0-9]/g, '')

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (!cleaned.startsWith('62') && cleaned.startsWith('8')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

/**
 * Generate 6-digit numeric OTP and cache it
 */
export function generateOtp(phone) {
  const normalized = normalizePhoneNumber(phone)
  const otp = crypto.randomInt(100000, 999999).toString()

  otpCache.set(normalized, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    createdAt: Date.now(),
  })

  return { normalized, otp }
}

/**
 * Send OTP to user's WhatsApp
 */
export async function sendOtpToWhatsApp(phone) {
  const { normalized, otp } = generateOtp(phone)
  const fonnteToken = process.env.FONNTE_TOKEN

  if (fonnteToken) {
    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          target: normalized,
          message: `[Toko Usaha Anda] Kode verifikasi Anda adalah: *${otp}*.\n\nJangan berikan kode ini kepada siapa pun. Kode berlaku selama 5 menit untuk mengamankan pesanan Anda.`,
        }),
      })
      const result = await response.json()
      return {
        success: true,
        message: 'Kode OTP telah dikirim ke WhatsApp Anda.',
        simulated: false,
        fonnteStatus: result.status,
      }
    } catch (err) {
      console.error('Fonnte WhatsApp gateway error:', err)
    }
  }

  // Simulated fallback mode (when no third-party WhatsApp gateway token is set)
  console.log(`\n======================================================`)
  console.log(`[SIMULASI OTP WHATSAPP]`)
  console.log(`Nomor Tujuan : ${normalized} (${phone})`)
  console.log(`Kode OTP     : ${otp}`)
  console.log(`Masa Berlaku : 5 Menit`)
  console.log(`======================================================\n`)

  return {
    success: true,
    message: 'Kode OTP telah dikirim (Mode Simulasi). Periksa log konsol atau gunakan kode yang tertera.',
    simulated: true,
    devOtp: otp, // Provided for easy manual testing
  }
}

/**
 * Verify OTP submitted by customer
 */
export function verifyOtpCode(phone, submittedCode) {
  const normalized = normalizePhoneNumber(phone)
  const record = otpCache.get(normalized)

  if (!record) {
    return {
      success: false,
      message: 'Kode OTP belum diminta atau sudah kedaluwarsa. Silakan kirim ulang kode baru.',
    }
  }

  if (Date.now() > record.expiresAt) {
    otpCache.delete(normalized)
    return {
      success: false,
      message: 'Kode OTP telah kedaluwarsa. Silakan minta kode OTP baru.',
    }
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpCache.delete(normalized)
    return {
      success: false,
      message: 'Batas percobaan memasukkan kode telah terlampaui. Silakan minta kode OTP baru.',
    }
  }

  if (record.otp !== String(submittedCode).trim()) {
    record.attempts += 1
    return {
      success: false,
      message: `Kode OTP salah. Sisa kesempatan: ${MAX_VERIFY_ATTEMPTS - record.attempts} kali.`,
    }
  }

  // OTP verified successfully
  otpCache.delete(normalized)
  verifiedPhoneCache.set(normalized, {
    verifiedAt: Date.now(),
    expiresAt: Date.now() + VERIFICATION_TTL_MS,
  })

  return {
    success: true,
    message: 'Nomor WhatsApp berhasil diverifikasi!',
    verifiedPhone: normalized,
  }
}

/**
 * Check if a phone number has been verified within valid TTL
 */
export function isPhoneNumberVerified(phone) {
  const normalized = normalizePhoneNumber(phone)
  const verifiedRecord = verifiedPhoneCache.get(normalized)

  if (!verifiedRecord) return false
  if (Date.now() > verifiedRecord.expiresAt) {
    verifiedPhoneCache.delete(normalized)
    return false
  }

  return true
}
