/**
 * Auth Routes
 * Secured with rate limiting and input validation
 */

import express from 'express'
import { register, login, getMe, logout, updateProfile } from '../controllers/authController.js'
import { sendOtp, verifyOtp, checkPhoneStatus } from '../controllers/otpController.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { authLimiter } from '../middleware/security.js'
import { validateLogin, validateRegister, validateUpdateProfile } from '../middleware/validate.js'

const router = express.Router()

// Apply strict rate limit to all auth endpoints
router.use(authLimiter)

router.post('/register', validateRegister, register)
router.post('/login', validateLogin, login)
router.post('/logout', logout)
router.get('/me', authenticate, getMe)
router.put('/profile', authenticate, validateUpdateProfile, updateProfile)
router.post('/send-otp', sendOtp)
router.post('/verify-otp', optionalAuthenticate, verifyOtp)
router.get('/check-phone', checkPhoneStatus)

export default router
