/**
 * Auth Controller
 * Handles registration, login, and user profile retrieval.
 *
 * Security measures:
 * - Constant-time password comparison (prevents timing attacks)
 * - Generic error messages (prevents user enumeration)
 * - Passwords never returned in any response
 * - bcrypt cost factor: 12 (industry standard for 2024+)
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS } from '../constants/index.js'
import { logWarn } from '../utils/logger.js'

import {
  verifyEmailVerificationOtp,
  verifyOtpCode,
  normalizePhoneNumber,
  validateEmailDomain,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  consumeResetToken,
} from '../services/otpService.js'

// Bcrypt cost factor — 12 is the current industry recommendation
const BCRYPT_ROUNDS = 12

// Dummy hash used for constant-time comparison when user is not found
// Prevents timing attacks that reveal whether an email exists
const DUMMY_HASH = await bcrypt.hash('dummy-password-for-timing-safety', BCRYPT_ROUNDS)

/**
 * Cookie options for security
 */
const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents JavaScript access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Support cross-origin between Vercel frontends and backend
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}

/**
 * Generate a signed JWT and set it in a cookie
 * @param {Object} res - Express response
 * @param {Object} user - User object
 */
const sendTokenResponse = (res, user, statusCode, message) => {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  res.cookie('token', token, COOKIE_OPTIONS)

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    },
  })
}

/**
 * POST /api/auth/register
 * Supports strict Email registration (Option C & A) and WhatsApp-first registration (Option A)
 */
export const register = asyncHandler(async (req, res) => {
  const { channel = 'EMAIL', email, name, password, phone, otp } = req.body

  // ─── Jalur Registrasi WhatsApp (WhatsApp-First) ──────────────────────────
  if (channel === 'WHATSAPP') {
    if (!phone?.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Nomor WhatsApp wajib diisi untuk registrasi jalur WhatsApp.',
      })
    }

    const cleanPhone = phone.trim()
    const normalized = normalizePhoneNumber(cleanPhone)
    if (!normalized || normalized.length < 10) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Nomor WhatsApp minimal 10 digit angka valid.',
      })
    }

    // Cek apakah nomor WhatsApp sudah pernah terdaftar
    const existingPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: normalized },
          ...(normalized.startsWith('62') ? [{ phone: '0' + normalized.slice(2) }] : []),
        ],
      },
    })
    if (existingPhone) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        error: 'Nomor WhatsApp ini sudah terdaftar pada akun lain. Silakan login atau gunakan nomor lain.',
      })
    }

    // Verifikasi OTP WhatsApp secara strict dari waOtpCache
    const otpVerification = verifyOtpCode(normalized, otp)
    if (!otpVerification.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: otpVerification.message,
      })
    }

    let finalEmail = `${normalized}@whatsapp.user`
    if (email?.trim()) {
      const cleanEmail = email.trim().toLowerCase()
      const domainCheck = await validateEmailDomain(cleanEmail)
      if (!domainCheck.valid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: domainCheck.message })
      }
      const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } })
      if (existingEmail) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: 'Email ini sudah terdaftar pada akun lain. Gunakan email lain.',
        })
      }
      finalEmail = cleanEmail
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        email: finalEmail,
        name,
        password: hashedPassword,
        phone: normalized,
        isEmailVerified: false,
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    })

    return sendTokenResponse(res, user, HTTP_STATUS.CREATED, 'Pendaftaran akun via WhatsApp berhasil diverifikasi.')
  }

  // ─── Jalur Registrasi Email (Strict Email OTP) ───────────────────────────
  const cleanEmail = (email || '').trim().toLowerCase()

  // 1. Validasi format & domain email aktif (Opsi C)
  const domainCheck = await validateEmailDomain(cleanEmail)
  if (!domainCheck.valid) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: domainCheck.message,
    })
  }

  // 2. Cek apakah email sudah terdaftar
  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } })
  if (existingUser) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      error: 'Akun dengan email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk.',
    })
  }

  // 3. Validasi nomor telepon/WhatsApp jika diisi opsional
  if (phone?.trim()) {
    const cleanPhone = phone.trim()
    const normalized = normalizePhoneNumber(cleanPhone)
    const existingPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: normalized },
          ...(normalized.startsWith('62') ? [{ phone: '0' + normalized.slice(2) }] : []),
        ],
      },
    })
    if (existingPhone) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        error: 'Nomor telepon/WhatsApp sudah terdaftar pada akun lain. Silakan login atau gunakan nomor lain.',
      })
    }
  }

  // 4. Verifikasi kode OTP email secara strict dari tabel email_verification_otps
  const otpVerification = await verifyEmailVerificationOtp(cleanEmail, otp)
  if (!otpVerification.success) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: otpVerification.message,
    })
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name,
      password: hashedPassword,
      phone: phone?.trim() || null,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      isPhoneVerified: false,
    },
  })

  sendTokenResponse(res, user, HTTP_STATUS.CREATED, 'Pendaftaran akun berhasil diverifikasi.')
})

/**
 * POST /api/auth/login
 * Supports login via Email or WhatsApp Phone Number
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const identifier = (email || '').trim()

  const normalizedPhone = normalizePhoneNumber(identifier)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ...(identifier.startsWith('0') ? [{ phone: '62' + identifier.slice(1) }] : []),
      ],
    },
  })

  const hashToCompare = user?.password ?? DUMMY_HASH
  const isValidPassword = await bcrypt.compare(password, hashToCompare)

  if (!user || !isValidPassword) {
    logWarn('Failed login attempt', { identifier, ip: req.ip })
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Email, nomor WhatsApp, atau kata sandi tidak sesuai.',
    })
  }

  sendTokenResponse(res, user, HTTP_STATUS.OK, 'Login berhasil.')
})

/**
 * POST /api/auth/logout
 * Clears the auth cookie
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    ...COOKIE_OPTIONS,
    maxAge: 1, // Expire immediately
  })

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully.',
  })
})

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: true,
    },
  })

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'User not found.' })
  }

  res.status(HTTP_STATUS.OK).json({ user })
})

/**
 * PUT /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body

  const currentUser = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  })

  if (!currentUser) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'User tidak ditemukan.' })
  }

  // Deteksi jenis registrasi akun:
  // Akun WhatsApp ditandai oleh isPhoneVerified = true, atau email default @whatsapp.user
  const isWhatsAppUser = Boolean(
    currentUser.isPhoneVerified || currentUser.email?.endsWith('@whatsapp.user')
  )

  let finalEmail = currentUser.email
  let normalizedPhone = currentUser.phone

  if (isWhatsAppUser) {
    // ── AKUN JALUR WHATSAPP ──
    // 1. Nomor telepon adalah identitas utama (login credential), TIDAK DAPAT DIUBAH
    if (phone !== undefined && phone !== null) {
      const cleanPhone = phone.trim()
      const reqNormalized = normalizePhoneNumber(cleanPhone)
      const currentNormalized = normalizePhoneNumber(currentUser.phone)
      if (reqNormalized && currentNormalized && reqNormalized !== currentNormalized) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Nomor WhatsApp merupakan identitas utama akun Anda dan tidak dapat diubah.',
        })
      }
    }

    // 2. Email dapat diisi/diperbarui dengan email asli pengguna
    if (email !== undefined && email !== null) {
      const cleanEmail = email.trim().toLowerCase()
      if (cleanEmail && cleanEmail !== currentUser.email.toLowerCase()) {
        const domainCheck = await validateEmailDomain(cleanEmail)
        if (!domainCheck.valid) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: domainCheck.message })
        }

        const existingUserWithEmail = await prisma.user.findFirst({
          where: {
            id: { not: req.userId },
            email: cleanEmail,
          },
        })

        if (existingUserWithEmail) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            error: 'Email ini sudah terdaftar pada akun lain. Silakan gunakan email lain.',
          })
        }

        finalEmail = cleanEmail
      }
    }
  } else {
    // ── AKUN JALUR EMAIL ──
    // 1. Email adalah identitas utama, TIDAK DAPAT DIUBAH
    if (email !== undefined && email !== null) {
      const cleanEmail = email.trim().toLowerCase()
      if (cleanEmail && cleanEmail !== currentUser.email.toLowerCase()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Email merupakan identitas utama akun Anda dan tidak dapat diubah.',
        })
      }
    }

    // 2. Nomor telepon dapat diisi / diubah
    if (phone !== undefined) {
      if (phone?.trim()) {
        const cleanPhone = phone.trim()
        normalizedPhone = normalizePhoneNumber(cleanPhone)

        // Cek apakah nomor baru sudah dipakai oleh user lain
        const existingUserWithPhone = await prisma.user.findFirst({
          where: {
            id: { not: req.userId },
            OR: [
              { phone: cleanPhone },
              { phone: normalizedPhone },
              ...(normalizedPhone.startsWith('62') ? [{ phone: '0' + normalizedPhone.slice(2) }] : []),
            ],
          },
        })

        if (existingUserWithPhone) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            error: 'Nomor WhatsApp/telepon ini sudah digunakan oleh akun lain.',
          })
        }
      } else {
        normalizedPhone = null
      }

      // Jika nomor berubah, bersihkan sesi reset password lama terkait nomor sebelumnya
      if (currentUser?.phone && currentUser.phone !== normalizedPhone) {
        await prisma.passwordResetSession
          .deleteMany({
            where: {
              channel: 'WHATSAPP',
              identifier: { in: [currentUser.phone, normalizePhoneNumber(currentUser.phone)] },
            },
          })
          .catch(() => {})
      }
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      email: finalEmail,
      phone: normalizedPhone,
      ...(address !== undefined && { address: address?.trim() || null }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      role: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: true,
    },
  })

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully.',
    user: updatedUser,
  })
})

/**
 * POST /api/auth/forgot-password
 * Rate-limited. Returns generic response to prevent user enumeration.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier, channel = 'EMAIL' } = req.body
  const cleanId = (identifier || '').trim()

  if (!cleanId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Email atau nomor WhatsApp wajib diisi.',
    })
  }

  const isEmail = channel === 'EMAIL'
  let user = null

  if (isEmail) {
    const cleanEmail = cleanId.toLowerCase()
    user = await prisma.user.findUnique({ where: { email: cleanEmail } })
  } else {
    const normalizedPhone = normalizePhoneNumber(cleanId)
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanId },
          { phone: normalizedPhone },
          ...(normalizedPhone.startsWith('62') ? [{ phone: '0' + normalizedPhone.slice(2) }] : []),
        ],
      },
    })
  }

  // To prevent user enumeration / account harvesting:
  // If user is not found, we delay slightly to mimic processing time and return a generic success message
  if (!user) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: isEmail
        ? 'Jika akun terdaftar, kode verifikasi reset kata sandi telah dikirim ke email Anda.'
        : 'Jika akun terdaftar, kode verifikasi reset kata sandi telah dikirim ke WhatsApp Anda.',
      cooldownSeconds: 60,
    })
  }

  const target = isEmail ? user.email : user.phone
  const result = await sendPasswordResetOtp(target, channel)

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: result.message,
    simulated: result.simulated,
    devOtp: result.devOtp,
    cooldownSeconds: result.cooldownSeconds || 60,
    expiresInSeconds: result.expiresInSeconds || 900,
  })
})

/**
 * POST /api/auth/verify-reset-otp
 * Verifies OTP code and issues single-use reset token
 */
export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { identifier, channel = 'EMAIL', otp } = req.body
  const cleanId = (identifier || '').trim()
  const cleanOtp = (otp || '').trim()

  if (!cleanId || !cleanOtp) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Identitas akun dan kode OTP wajib diisi.',
    })
  }

  const result = await verifyPasswordResetOtp(cleanId, channel, cleanOtp)
  if (!result.success) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: result.message,
    })
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Kode OTP terverifikasi.',
    resetToken: result.resetToken,
  })
})

/**
 * POST /api/auth/reset-password
 * Consumes single-use reset token and securely updates password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body

  if (!resetToken || !newPassword) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Token reset dan kata sandi baru wajib diisi.',
    })
  }

  if (newPassword.length < 6 || !/\d/.test(newPassword)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Kata sandi minimal 6 karakter dan wajib mengandung angka.',
    })
  }

  const session = await consumeResetToken(resetToken)
  if (!session) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Sesi reset kata sandi tidak valid atau telah kedaluwarsa. Silakan ulangi proses lupa kata sandi.',
    })
  }

  // Find user by identifier
  let user = null
  if (session.channel === 'EMAIL') {
    user = await prisma.user.findUnique({ where: { email: session.identifier } })
  } else {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: session.identifier },
          ...(session.identifier.startsWith('62') ? [{ phone: '0' + session.identifier.slice(2) }] : []),
        ],
      },
    })
  }

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      error: 'Pengguna tidak ditemukan.',
    })
  }

  // Hash new password using bcrypt cost factor 12
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  logWarn('Password successfully reset for user', { userId: user.id, email: user.email })

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.',
  })
})

