/**
 * Authentication Middleware
 * Handles JWT token verification and role-based access control
 */

import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../config/database.js'
import { HTTP_STATUS, USER_ROLE, ERROR_MESSAGES } from '../constants/index.js'
import { logWarn } from '../utils/logger.js'

/**
 * Short fingerprint of the user's password hash, stored in the JWT as `pwv`.
 * Changing/resetting the password changes the hash, so every token issued before stops working.
 * (A fingerprint of the bcrypt hash, never the hash itself, goes into the token.)
 */
export const passwordVersion = passwordHash =>
  crypto.createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 16)

const readToken = req => {
  if (req.cookies?.token) return req.cookies.token
  const authHeader = req.headers.authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
}

/**
 * Verify the JWT and check it against the current user row: the user must still exist and the
 * password must be unchanged since the token was issued. Role always comes from the database,
 * so a demoted admin loses access immediately. Returns the user or null.
 */
async function resolveUser(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, password: true },
  })
  if (!user || decoded.pwv !== passwordVersion(user.password)) return null
  return user
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (req, res, next) => {
  const token = readToken(req)
  if (!token) {
    logWarn('Authentication failed: Empty token', { path: req.path, method: req.method })
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.NO_TOKEN })
  }

  let user = null
  try {
    user = await resolveUser(token)
  } catch (error) {
    if (!(error instanceof jwt.JsonWebTokenError)) return next(error) // DB outage: 500, not "logged out"
  }
  if (!user) {
    logWarn('Authentication failed: Invalid or revoked token', { path: req.path, method: req.method })
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: ERROR_MESSAGES.INVALID_TOKEN })
  }

  req.userId = user.id
  req.userRole = user.role
  next()
}

/**
 * Optional Authentication Middleware
 * Attaches user info if a valid, unrevoked token exists, but does not reject the request if not
 */
export const optionalAuthenticate = async (req, res, next) => {
  const token = readToken(req)
  if (token) {
    try {
      const user = await resolveUser(token)
      if (user) {
        req.userId = user.id
        req.userRole = user.role
      }
    } catch {
      // Continue without user info
    }
  }
  next()
}

/**
 * Admin Only Middleware
 * Ensures only admin users can access the route
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const adminOnly = (req, res, next) => {
  if (req.userRole !== USER_ROLE.ADMIN) {
    logWarn('Admin access denied', {
      path: req.path,
      method: req.method,
      userId: req.userId,
      userRole: req.userRole,
    })
    
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      error: ERROR_MESSAGES.ADMIN_REQUIRED,
    })
  }
  
  next()
}

