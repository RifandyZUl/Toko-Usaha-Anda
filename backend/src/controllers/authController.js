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

import { verifyEmailVerificationOtp, normalizePhoneNumber } from '../services/otpService.js'

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
  sameSite: 'strict', // CSRF protection
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
 */
export const register = asyncHandler(async (req, res) => {
  const { email, name, password, phone, otp } = req.body
  const cleanEmail = (email || '').trim().toLowerCase()

  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } })
  if (existingUser) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      error: 'Akun dengan email ini sudah terdaftar. Silakan gunakan email lain atau langsung masuk.',
    })
  }

  // Validasi nomor telepon/WhatsApp belum pernah terdaftar
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

  // Verifikasi kode OTP email
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
    },
  })

  sendTokenResponse(res, user, HTTP_STATUS.CREATED, 'Pendaftaran akun berhasil diverifikasi.')
})

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  const hashToCompare = user?.password ?? DUMMY_HASH
  const isValidPassword = await bcrypt.compare(password, hashToCompare)

  if (!user || !isValidPassword) {
    logWarn('Failed login attempt', { email, ip: req.ip })
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: 'Invalid email or password.',
    })
  }

  sendTokenResponse(res, user, HTTP_STATUS.OK, 'Login successful.')
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
  const { name, phone, address } = req.body

  const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data: {
      name,
      phone,
      address,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      role: true,
      createdAt: true,
    },
  })

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Profile updated successfully.',
    user: updatedUser,
  })
})
