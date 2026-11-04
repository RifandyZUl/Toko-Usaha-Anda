import crypto from 'crypto'
import dns from 'dns/promises'
import prisma from '../config/database.js'
import { sendEmailOtp, sendPasswordResetEmail } from './emailService.js'
import { logInfo, logError, logWarn } from '../utils/logger.js'

/**
 * Validate email format and verify domain has active DNS MX records
 * Rejects fake / non-existent domains before creating OTP
 */
export async function validateEmailDomain(email) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { valid: false, message: 'Format alamat email tidak valid.' }
  }
  const parts = cleanEmail.split('@')
  if (parts.length !== 2 || !parts[1] || !parts[1].includes('.')) {
    return { valid: false, message: 'Domain email tidak lengkap atau tidak valid.' }
  }
  const domain = parts[1].trim()

  // Catch common domain typos
  const typoMap = {
    'gnail.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
  }
  if (typoMap[domain]) {
    return {
      valid: false,
      message: `Kemungkinan salah ketik "${domain}". Apakah maksud Anda "${typoMap[domain]}"?`,
    }
  }

  // Check MX records via DNS
  try {
    const mxRecords = await dns.resolveMx(domain)
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        message: `Domain email @${domain} tidak memiliki mail exchange (MX) aktif untuk menerima email.`,
      }
    }
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'SERVFAIL') {
      return {
        valid: false,
        message: `Domain email @${domain} tidak ditemukan di internet atau tidak dapat menerima email.`,
      }
    }
    // Network glitch: log and let pass
    logWarn(`DNS MX check warning for domain ${domain}:`, err.message)
  }

  return { valid: true }
}

/**
 * Service to manage Email & WhatsApp OTP generation, delivery, and verification.
 */

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

const createHttpError = (message, statusCode) => {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

// ==========================================
// WHATSAPP DELIVERY (Fonnte)
// ==========================================

const getFonnteToken = () => {
  const token = process.env.FONNTE_TOKEN?.trim()
  return token && token !== 'your_fonnte_token_here' ? token : null
}

const logSimulatedWhatsAppOtp = (target, otp) => {
  console.log(`\n======================================================`)
  console.log(`[SIMULASI OTP WHATSAPP]`)
  console.log(`Nomor Tujuan : ${target}`)
  console.log(`Kode OTP     : ${otp}`)
  console.log(`Catatan      : Isi FONNTE_TOKEN di backend/.env untuk kirim WA asli`)
  console.log(`======================================================\n`)
}

/**
 * Send an OTP message from the store's WhatsApp number (connected in the Fonnte dashboard).
 * Without a token, simulation (devOtp returned) is allowed ONLY when NODE_ENV=development.
 * Any delivery failure throws — it never silently falls back to simulation.
 */
async function deliverWhatsAppOtp(target, message, otp) {
  const token = getFonnteToken()
  if (!token) {
    if (process.env.NODE_ENV !== 'development') {
      logError('FONNTE_TOKEN not configured — WhatsApp OTP cannot be sent')
      throw createHttpError('Layanan WhatsApp sedang tidak tersedia. Silakan gunakan email atau hubungi admin toko.', 503)
    }
    logSimulatedWhatsAppOtp(target, otp)
    return { simulated: true, devOtp: otp }
  }

  let result
  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ target, message }),
    })
    result = await response.json()
  } catch (err) {
    logError('Fonnte WhatsApp gateway error:', err)
    throw createHttpError('Terjadi kendala jaringan saat menghubungi gateway WhatsApp. Silakan coba lagi.', 502)
  }

  if (result?.status !== true) {
    logError('Fonnte WhatsApp gateway returned false status:', result)
    const reason = result?.reason || 'Nomor WhatsApp tidak dapat menerima pesan atau sedang tidak aktif.'
    throw createHttpError(`Gagal mengirim WhatsApp: ${reason}`, 400)
  }

  logInfo(`WhatsApp OTP sent to ${target}`)
  return { simulated: false }
}

/**
 * Build the API response shared by every "send WhatsApp OTP" endpoint
 */
const buildWhatsAppSendResponse = (delivery, sentMessage, extra = {}) => ({
  success: true,
  message: delivery.simulated ? `${sentMessage} [Mode Simulasi]` : sentMessage,
  simulated: delivery.simulated,
  ...(delivery.devOtp && { devOtp: delivery.devOtp }),
  expiresInSeconds: 60,
  cooldownSeconds: 60,
  ...extra,
})

// ==========================================
// WHATSAPP OTP FUNCTIONS (persisted in phone_verification_otps)
// ==========================================

const findPendingPhoneOtp = phone =>
  prisma.phoneVerificationOtp.findFirst({
    where: { phone, verifiedAt: null },
    orderBy: { createdAt: 'desc' },
  })

/**
 * Store a new WhatsApp OTP (enforcing the 60s resend cooldown) and deliver it.
 * If delivery fails the record is removed so the customer can retry right away.
 */
async function issueWhatsAppOtp(normalized, buildMessage) {
  const latest = await findPendingPhoneOtp(normalized)
  if (latest) {
    const elapsed = Date.now() - new Date(latest.createdAt).getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000)
      throw createHttpError(`Mohon tunggu ${remainingSeconds} detik sebelum meminta kode OTP WhatsApp baru.`, 429)
    }
  }

  const otp = crypto.randomInt(100000, 999999).toString()
  await prisma.phoneVerificationOtp.deleteMany({ where: { phone: normalized, verifiedAt: null } })
  const record = await prisma.phoneVerificationOtp.create({
    data: { phone: normalized, otpHash: hashOtp(otp), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  })

  try {
    return await deliverWhatsAppOtp(normalized, buildMessage(otp), otp)
  } catch (err) {
    await prisma.phoneVerificationOtp.delete({ where: { id: record.id } }).catch(() => {})
    throw err
  }
}

/**
 * Send OTP to a customer's WhatsApp (phone verification)
 */
export async function sendOtpToWhatsApp(phone) {
  const normalized = normalizePhoneNumber(phone)
  const delivery = await issueWhatsAppOtp(
    normalized,
    otp => `[Toko Usaha Anda] Kode verifikasi Anda adalah: *${otp}*.\n\nKode berlaku selama 1 menit. Jangan berikan kode ini kepada siapa pun demi keamanan Anda.`
  )
  return buildWhatsAppSendResponse(delivery, 'Kode OTP telah dikirim ke nomor WhatsApp Anda.')
}

/**
 * Verify OTP submitted by customer for WhatsApp.
 * On success the record is kept as "verified" for VERIFICATION_TTL_MS (used by isPhoneNumberVerified).
 */
export async function verifyOtpCode(phone, submittedCode) {
  const normalized = normalizePhoneNumber(phone)
  const record = await findPendingPhoneOtp(normalized)

  if (!record) {
    return { success: false, message: 'Kode OTP belum diminta atau sudah kedaluwarsa. Silakan kirim ulang kode baru.' }
  }

  if (new Date() > new Date(record.expiresAt) || record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.phoneVerificationOtp.deleteMany({ where: { phone: normalized, verifiedAt: null } })
    return {
      success: false,
      message: record.attempts >= MAX_VERIFY_ATTEMPTS
        ? 'Batas percobaan memasukkan kode telah terlampaui. Silakan minta kode OTP baru.'
        : 'Kode OTP telah kedaluwarsa. Silakan minta kode OTP baru.',
    }
  }

  const isMatch = crypto.timingSafeEqual(
    Buffer.from(record.otpHash, 'utf8'),
    Buffer.from(hashOtp(String(submittedCode ?? '')), 'utf8')
  )
  if (!isMatch) {
    const updated = await prisma.phoneVerificationOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    })
    return { success: false, message: `Kode OTP salah. Sisa kesempatan: ${MAX_VERIFY_ATTEMPTS - updated.attempts} kali.` }
  }

  await prisma.phoneVerificationOtp.update({
    where: { id: record.id },
    data: { otpHash: null, verifiedAt: new Date(), expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) },
  })

  return { success: true, message: 'Nomor WhatsApp berhasil diverifikasi!', verifiedPhone: normalized }
}

/**
 * Check if a phone number has been verified within VERIFICATION_TTL_MS
 */
export async function isPhoneNumberVerified(phone) {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return false

  const record = await prisma.phoneVerificationOtp.findFirst({
    where: { phone: normalized, verifiedAt: { not: null }, expiresAt: { gt: new Date() } },
    select: { id: true },
  })
  return Boolean(record)
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

  // Domain validation & MX check (Opsi C)
  const domainCheck = await validateEmailDomain(email)
  if (!domainCheck.valid) {
    const err = new Error(domainCheck.message)
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

/**
 * Send OTP for WhatsApp-First Registration (Opsi A)
 * Stored in phone_verification_otps (same as sendOtpToWhatsApp); does NOT touch emailVerificationOtp.
 */
export async function sendRegisterOtpToWhatsApp(rawPhone) {
  const normalized = normalizePhoneNumber(rawPhone)
  if (!normalized || normalized.length < 10) {
    throw createHttpError('Nomor WhatsApp tidak valid. Masukkan minimal 10 digit angka.', 400)
  }

  // Check if phone number already registered to another user
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
    throw createHttpError('Nomor WhatsApp ini sudah terdaftar pada akun lain. Silakan masuk atau gunakan nomor lain.', 409)
  }

  const delivery = await issueWhatsAppOtp(
    normalized,
    otp => `[Toko Usaha Anda] Kode verifikasi pendaftaran akun Anda adalah: *${otp}*.

Kode berlaku selama 1 menit. Jangan berikan kode ini kepada siapa pun demi keamanan Anda.`
  )
  return buildWhatsAppSendResponse(
    delivery,
    `Kode verifikasi OTP telah dikirim ke nomor WhatsApp Anda (${normalized}).`,
    { phone: normalized }
  )
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

// ==========================================
// PASSWORD RESET OTP & SESSION FUNCTIONS (Cluster & Multi-instance Safe)
// ==========================================

export const RESET_OTP_TTL_MS = 15 * 60 * 1000 // 15 minutes validity
export const RESET_SESSION_TTL_MS = 15 * 60 * 1000 // 15 minutes validity for reset token

/**
 * Send Password Reset OTP to Email or WhatsApp
 * Cluster-safe: Persisted in database (password_reset_sessions)
 */
export async function sendPasswordResetOtp(targetIdentifier, channel = 'EMAIL') {
  const isEmail = channel === 'EMAIL'
  const key = isEmail
    ? targetIdentifier.trim().toLowerCase()
    : normalizePhoneNumber(targetIdentifier)

  // Rate limit / resend cooldown check (60s) from database
  const existing = await prisma.passwordResetSession.findFirst({
    where: { identifier: key, channel },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    const timeSinceLast = Date.now() - new Date(existing.createdAt).getTime()
    if (timeSinceLast < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLast) / 1000)
      const err = new Error(`Mohon tunggu ${remainingSeconds} detik sebelum meminta kode baru.`)
      err.statusCode = 429
      throw err
    }
  }

  // Generate 6-digit cryptographic OTP
  const otp = crypto.randomInt(100000, 999999).toString()
  const otpHash = hashOtp(otp)
  const expiresAt = new Date(Date.now() + RESET_OTP_TTL_MS)

  // Clean up any stale sessions for this identifier
  await prisma.passwordResetSession.deleteMany({
    where: { identifier: key, channel },
  })

  // Create new session in PostgreSQL database
  await prisma.passwordResetSession.create({
    data: {
      identifier: key,
      channel,
      otpHash,
      expiresAt,
    },
  })

  if (isEmail) {
    const emailResult = await sendPasswordResetEmail(key, otp)
    return {
      success: true,
      message: 'Kode reset kata sandi telah dikirim ke email.',
      simulated: emailResult.simulated,
      devOtp: emailResult.devOtp,
      cooldownSeconds: 60,
      expiresInSeconds: 900,
    }
  } else {
    // Send via WhatsApp
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
            target: key,
            message: `[Toko Usaha Anda] Kode reset kata sandi akun Anda adalah: *${otp}*.\n\nKode berlaku selama 15 menit. Jangan berikan kode ini kepada siapa pun demi keamanan Anda.`,
          }),
        })

        const result = await response.json()
        if (result.status === true) {
          logInfo(`Password reset WhatsApp OTP sent to ${key}`)
          return {
            success: true,
            message: `Kode reset kata sandi telah dikirim ke WhatsApp (${key}).`,
            simulated: false,
            cooldownSeconds: 60,
            expiresInSeconds: 900,
          }
        }
      } catch (err) {
        logError('Error sending reset WA OTP:', err)
      }
    }

    // WhatsApp simulation mode
    console.log(`\n======================================================`)
    console.log(`[SIMULASI OTP WHATSAPP RESET KATA SANDI]`)
    console.log(`Nomor Tujuan : ${key}`)
    console.log(`Kode OTP     : ${otp}`)
    console.log(`Masa Berlaku : 15 Menit`)
    console.log(`======================================================\n`)

    return {
      success: true,
      message: `Kode reset kata sandi telah dikirim ke WhatsApp (${key}) [Mode Simulasi].`,
      simulated: true,
      devOtp: otp,
      cooldownSeconds: 60,
      expiresInSeconds: 900,
    }
  }
}

/**
 * Verify Password Reset OTP
 * Cluster-safe: Verifies against database record and atomically issues resetToken
 */
export async function verifyPasswordResetOtp(targetIdentifier, channel = 'EMAIL', submittedCode) {
  const isEmail = channel === 'EMAIL'
  const key = isEmail
    ? targetIdentifier.trim().toLowerCase()
    : normalizePhoneNumber(targetIdentifier)
  const cleanCode = (submittedCode || '').trim()

  const session = await prisma.passwordResetSession.findFirst({
    where: { identifier: key, channel },
    orderBy: { createdAt: 'desc' },
  })

  if (!session || !session.otpHash) {
    return {
      success: false,
      message: 'Kode OTP belum diminta atau sudah kedaluwarsa. Silakan minta kode baru.',
    }
  }

  if (new Date() > new Date(session.expiresAt)) {
    await prisma.passwordResetSession.deleteMany({ where: { identifier: key, channel } })
    return {
      success: false,
      message: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.',
    }
  }

  if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.passwordResetSession.deleteMany({ where: { identifier: key, channel } })
    return {
      success: false,
      message: 'Batas percobaan verifikasi telah habis. Silakan minta kode OTP baru.',
    }
  }

  const submittedHash = hashOtp(cleanCode)
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(session.otpHash, 'utf8'),
    Buffer.from(submittedHash, 'utf8')
  )

  if (!isMatch) {
    const updated = await prisma.passwordResetSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    })
    return {
      success: false,
      message: `Kode OTP salah. Sisa kesempatan: ${MAX_VERIFY_ATTEMPTS - updated.attempts} kali.`,
    }
  }

  // OTP is valid! Issue single-use reset token and expire OTP
  const resetToken = crypto.randomBytes(32).toString('hex')
  const tokenExpiresAt = new Date(Date.now() + RESET_SESSION_TTL_MS)

  await prisma.passwordResetSession.update({
    where: { id: session.id },
    data: {
      otpHash: null, // Wipe OTP to prevent reuse
      resetToken,
      isVerified: true,
      expiresAt: tokenExpiresAt,
    },
  })

  return {
    success: true,
    message: 'Verifikasi kode berhasil.',
    resetToken,
  }
}

/**
 * Validate and consume single-use reset token
 * Cluster-safe: Atomically verifies and deletes token from database
 */
export async function consumeResetToken(resetToken) {
  if (!resetToken) return null

  const session = await prisma.passwordResetSession.findUnique({
    where: { resetToken },
  })
  if (!session || !session.isVerified) return null

  if (new Date() > new Date(session.expiresAt)) {
    await prisma.passwordResetSession.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  // Single-use: delete immediately from DB to prevent replay
  await prisma.passwordResetSession.delete({
    where: { id: session.id },
  })

  return {
    identifier: session.identifier,
    channel: session.channel,
  }
}

/**
 * Clean up expired password reset sessions and stale verification OTPs from database
 * Runs periodically to keep the tables lean and fast
 */
export async function cleanupExpiredResetSessions() {
  try {
    const now = new Date()

    // 1. Delete expired password reset sessions
    const resetResult = await prisma.passwordResetSession.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    })

    // 2. Also clean expired registration email verification OTPs
    const emailOtpResult = await prisma.emailVerificationOtp.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    })

    const totalCleaned = resetResult.count + emailOtpResult.count
    if (totalCleaned > 0) {
      logInfo('🧹 Auth background cleanup executed', {
        deletedResetSessions: resetResult.count,
        deletedEmailOtps: emailOtpResult.count,
      })
    }
  } catch (error) {
    logError('Error executing auth session cleanup cron', error)
  }
}

/**
 * Alias used by the Vercel Cron endpoint (/api/cron/cleanup).
 * Delegates to cleanupExpiredResetSessions.
 */
export const cleanupExpiredOtpSessions = cleanupExpiredResetSessions

/**
 * Start background cron interval for cleaning expired auth sessions
 * @param {number} intervalMs - Check interval in milliseconds (default: 1 hour)
 */
export function startResetSessionCleanupCron(intervalMs = 60 * 60 * 1000) {
  // Run on startup
  cleanupExpiredResetSessions()

  // Schedule periodic cleanup
  const intervalId = setInterval(cleanupExpiredResetSessions, intervalMs)
  logInfo('⏱️ Auth session cleanup background service started', {
    intervalMinutes: intervalMs / (60 * 1000),
  })

  return intervalId
}


