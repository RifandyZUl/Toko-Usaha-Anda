/**
 * Authentication Middleware
 * Handles JWT token verification and role-based access control
 */

import jwt from 'jsonwebtoken'
import { HTTP_STATUS, USER_ROLE, ERROR_MESSAGES } from '../constants/index.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'
import { logWarn } from '../utils/logger.js'

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    let token = null
    
    // Check for token in cookies (Primary)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    } 
    // Check for token in Authorization header (Fallback)
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }

    if (!token) {
      logWarn('Authentication failed: Empty token', {
        path: req.path,
        method: req.method,
      })
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.NO_TOKEN,
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Attach user info to request
    req.userId = decoded.userId
    req.userRole = decoded.role
    
    next()
  } catch (error) {
    logWarn('Authentication failed: Invalid token', {
      path: req.path,
      method: req.method,
      error: error.name,
    })
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.INVALID_TOKEN,
    })
  }
}

/**
 * Optional Authentication Middleware
 * Attaches user info if valid token exists, but does not reject request if not
 */
export const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    let token = null
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = decoded.userId
      req.userRole = decoded.role
    }
  } catch {
    // Continue without user info
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

