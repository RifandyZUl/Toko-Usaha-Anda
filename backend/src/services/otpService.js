import crypto from 'crypto'
import prisma from '../config/database.js'
import { sendEmailOtp } from './emailService.js'
import { logInfo, logError, logWarn } from '../utils/logger.js'

/**
 * Service to manage Email & WhatsApp OTP generation, delivery, and verification.
 */

// In-memory cache for WhatsApp OTPs and verified phone numbers
const waOtpCache = new Map()
const verifiedPhoneCache = new Map()

export const OTP_TTL_MS = 1 * 60 * 1000 // 1 minute validity (60 seconds)
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours validity
const MAX_VERIFY_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60 * 1000 // 60 seconds cooldown

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
 * Helper to hash OTP code with SHA-256
 */
function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex')
}

// ==========================================
// WHATSAPP OTP FUNCTIONS
// ==========================================

/**
 * Generate 6-digit numeric OTP and cache it for WhatsApp
 */
export function generateOtp(phone) {
  const normalized = normalizePhoneNumber(phone)
  const existing = waOtpCache.get(normalized)

  // Check resend cooldown
  if (existing && Date.now() - existing.createdAt < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.createdAt)) / 1000)
    const err = new Error(`Mohon tunggu ${remainingSeconds} detik sebelum meminta kode OTP WhatsApp baru.`)
    err.statusCode = 429
    throw err
  }

  const otp = crypto.randomInt(100000, 999999).toString()

  waOtpCache.set(normalized, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    createdAt: Date.now(),
  })

  return { normalized, otp }
}

/**
 * Send OTP to user's WhatsApp via Fonnte Gateway or Simulation
 */
export async function sendOtpToWhatsApp(phone) {
  const { normalized, otp } = generateOtp(phone)
  const fonnteToken = process.env.FONNTE_TOKEN?.trim()

  // Jika token Fonnte ada dan bukan placeholder
  if (fonnteToken && fonnteToken !== 'your_fonnte_token_here') {
    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          target: normalized,
          message: `[Toko Usaha Anda] Kode verifikasi Anda adalah: *${otp}*.\n\nKode berlaku selama 1 menit. Jangan berikan kode ini kepada siapa pun demi keamanan Anda.`,
        }),
      })

      const result = await response.json()
      if (result.status === true) {
        logInfo(`Real WhatsApp OTP sent successfully to ${normalized}`)
        return {
          success: true,
          message: 'Kode OTP telah dikirim ke nomor WhatsApp Anda.',
          simulated: false,
          expiresInSeconds: 60,
          cooldownSeconds: 60,
        }
      }

      logWarn('Fonnte API responded with error status:', result)
    } catch (err) {
      logError('Fonnte WhatsApp gateway error:', err)
    }
  }

  // Simulated fallback mode jika belum setting token Fonnte
  console.log(`\n======================================================`)
  console.log(`[SIMULASI OTP WHATSAPP]`)
  console.log(`Nomor Tujuan : ${normalized} (${phone})`)
  console.log(`Kode OTP     : ${otp}`)
  console.log(`Masa Berlaku : 1 Menit`)
  console.log(`Catatan      : Isi FONNTE_TOKEN di backend/.env untuk kirim WA asli`)
  console.log(`======================================================\n`)

  return {
    success: true,
    message: 'Kode OTP telah dikirim (Mode Simulasi). Periksa log konsol backend atau gunakan kode tertera.',
    simulated: true,
    devOtp: otp,
    expiresInSeconds: 60,
    cooldownSeconds: 60,
  }
}

/**
 * Verify OTP submitted by customer for WhatsApp
 */
export function verifyOtpCode(phone, submittedCode) {
  const normalized = normalizePhoneNumber(phone)
  const record = waOtpCache.get(normalized)

  if (!record) {
    return {
      success: false,
      message: 'Kode OTP belum diminta atau sudah kedaluwarsa. Silakan kirim ulang kode baru.',
    }
  }

  if (Date.now() > record.expiresAt) {
    waOtpCache.delete(normalized)
    return {
      success: false,
      message: 'Kode OTP telah kedaluwarsa. Silakan minta kode OTP baru.',
    }
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    waOtpCache.delete(normalized)
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
  waOtpCache.delete(normalized)
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

// ==========================================
// EMAIL OTP FUNCTIONS
// ==========================================

/**
 * Generate, save to DB, and send OTP to Email
 */
export async function sendEmailVerificationOtp(rawEmail) {
  const email = (rawEmail || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    const err = new Error('Format alamat email tidak valid.')
    err.statusCode = 400
    throw err
  }

  // Cek cooldown (minimal 60 detik)
  const latestOtp = await prisma.emailVerificationOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })

  if (latestOtp) {
    const timeSinceLast = Date.now() - new Date(latestOtp.createdAt).getTime()
    if (timeSinceLast < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000)
      const err = new Error(`Mohon tunggu ${remainingSeconds} detik sebelum meminta kode OTP email baru.`)
      err.statusCode = 429
      throw err
    }
  }

  // Buat kode 6 digit
  const otp = crypto.randomInt(100000, 999999).toString()
  const otpHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  // Hapus kode OTP lama untuk email ini agar tabel tetap rapi
  await prisma.emailVerificationOtp.deleteMany({
    where: { email },
  })

  // Simpan record baru
  await prisma.emailVerificationOtp.create({
    data: {
      email,
      otpHash,
      expiresAt,
    },
  })

  // Kirim email via nodemailer
  const sendResult = await sendEmailOtp(email, otp)

  return {
    success: true,
    message: sendResult.message,
    simulated: sendResult.simulated,
    devOtp: sendResult.devOtp,
    expiresInSeconds: 60,
    cooldownSeconds: 60,
  }
}

// In-memory cache for tracking WA register cooldown per number
const waRegisterCooldownCache = new Map()

/**
 * Send OTP for Registration via WhatsApp (Fallback when email OTP is not received)
 */
export async function sendRegisterOtpToWhatsApp(rawEmail, rawPhone) {
  const email = (rawEmail || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    const err = new Error('Format alamat email tidak valid.')
    err.statusCode = 400
    throw err
  }

  const normalized = normalizePhoneNumber(rawPhone)
  if (!normalized || normalized.length < 10) {
    const err = new Error('Nomor WhatsApp tidak valid. Masukkan minimal 10 digit angka.')
    err.statusCode = 400
    throw err
  }

  // 1. Check if email already registered
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const err = new Error('Email ini sudah terdaftar. Silakan login atau gunakan email lain.')
    err.statusCode = 409
    throw err
  }

  // 2. Check if phone number already registered to another user
  const existingPhone = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: rawPhone.trim() },
        { phone: normalized },
        ...(normalized.startsWith('62') ? [{ phone: '0' + normalized.slice(2) }] : []),
      ],
    },
  })
  if (existingPhone) {
    const err = new Error('Nomor WhatsApp ini sudah terdaftar pada akun lain. Silakan masuk atau gunakan nomor lain.')
    err.statusCode = 409
    throw err
  }

  // 3. Check WhatsApp resend cooldown (independent from email cooldown)
  const lastWaSent = waRegisterCooldownCache.get(normalized)
  if (lastWaSent && Date.now() - lastWaSent < RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastWaSent)) / 1000)
    const err = new Error(`Mohon tunggu ${remainingSeconds} detik sebelum meminta kode OTP WhatsApp baru.`)
    err.statusCode = 429
    throw err
  }

  // 4. Generate 6-digit OTP code with 1 minute expiry
  const otp = crypto.randomInt(100000, 999999).toString()
  const otpHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  // Replace existing OTP in DB
  await prisma.emailVerificationOtp.deleteMany({ where: { email } })
  await prisma.emailVerificationOtp.create({
    data: {
      email,
      otpHash,
      expiresAt,
    },
  })

  // Track WhatsApp send cooldown
  waRegisterCooldownCache.set(normalized, Date.now())

  const fonnteToken = process.env.FONNTE_TOKEN?.trim()

  if (fonnteToken && fonnteToken !== 'your_fonnte_token_here') {
    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: fonnteToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          target: normalized,
          message: `[Toko Usaha Anda] Kode verifikasi pendaftaran akun Anda adalah: *${otp}*.\n\nKode berlaku selama 1 menit. Jangan berikan kode ini kepada siapa pun demi keamanan Anda.`,
        }),
      })

      const result = await response.json()
      if (result.status === true) {
        logInfo(`Real WhatsApp Registration OTP sent successfully to ${normalized}`)
        return {
          success: true,
          message: `Kode verifikasi OTP telah dikirim ke nomor WhatsApp Anda (${normalized}).`,
          simulated: false,
          expiresInSeconds: 60,
          cooldownSeconds: 60,
          phone: normalized,
        }
      }

      logError('Fonnte WhatsApp gateway returned false status:', result)
      const reason = result.reason || result.message || 'Nomor WhatsApp tidak dapat menerima pesan atau sedang tidak aktif.'
      const err = new Error(`Gagal mengirim WhatsApp: ${reason}`)
      err.statusCode = 400
      throw err
    } catch (err) {
      if (err.statusCode) throw err
      logError('Fonnte WhatsApp gateway error for registration OTP:', err)
      const networkErr = new Error('Terjadi kendala jaringan saat menghubungi gateway WhatsApp. Silakan coba lagi.')
      networkErr.statusCode = 502
      throw networkErr
    }
  }

  // Fallback Simulation Mode (only if FONNTE_TOKEN not configured)
  console.log(`\n======================================================`)
  console.log(`[SIMULASI OTP WHATSAPP PENDAFTARAN]`)
  console.log(`Email User   : ${email}`)
  console.log(`Nomor Tujuan : ${normalized} (${rawPhone})`)
  console.log(`Kode OTP     : ${otp}`)
  console.log(`Masa Berlaku : 1 Menit`)
  console.log(`Catatan      : Isi FONNTE_TOKEN di backend/.env untuk kirim WA asli`)
  console.log(`======================================================\n`)

  return {
    success: true,
    message: `Kode OTP verifikasi telah dikirim ke nomor WhatsApp (${normalized}) [Mode Simulasi]. Gunakan kode tertera.`,
    simulated: true,
    devOtp: otp,
    expiresInSeconds: 60,
    cooldownSeconds: 60,
    phone: normalized,
  }
}

/**
 * Verify OTP submitted for Email verification
 */
export async function verifyEmailVerificationOtp(rawEmail, submittedCode) {
  const email = (rawEmail || '').trim().toLowerCase()
  const cleanCode = (submittedCode || '').trim()

  if (!email || !cleanCode) {
    return {
      success: false,
      message: 'Email dan kode OTP wajib diisi.',
    }
  }

  const record = await prisma.emailVerificationOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    return {
      success: false,
      message: 'Kode OTP belum diminta atau sudah kedaluwarsa. Silakan kirim ulang kode baru.',
    }
  }

  if (new Date() > new Date(record.expiresAt)) {
    await prisma.emailVerificationOtp.deleteMany({ where: { email } })
    return {
      success: false,
      message: 'Kode OTP telah kedaluwarsa (lebih dari 1 menit). Silakan minta kode baru.',
    }
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.emailVerificationOtp.deleteMany({ where: { email } })
    return {
      success: false,
      message: 'Batas percobaan memasukkan kode telah habis. Silakan kirim ulang kode OTP.',
    }
  }

  const submittedHash = hashOtp(cleanCode)
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(record.otpHash, 'utf8'),
    Buffer.from(submittedHash, 'utf8')
  )

  if (!isMatch) {
    await prisma.emailVerificationOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    })

    return {
      success: false,
      message: `Kode OTP salah. Sisa kesempatan: ${MAX_VERIFY_ATTEMPTS - (record.attempts + 1)} kali.`,
    }
  }

  // Verifikasi berhasil, hapus token OTP dari database
  await prisma.emailVerificationOtp.deleteMany({ where: { email } })

  return {
    success: true,
    message: 'Email berhasil diverifikasi!',
  }
}
