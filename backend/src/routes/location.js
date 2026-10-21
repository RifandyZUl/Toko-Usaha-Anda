/**
 * Location Routes
 * Public endpoints for location and postal code lookups
 */

import { Router } from 'express'
import { getPostalCodes } from '../controllers/locationController.js'

const router = Router()

// GET /api/location/postal-code
router.get('/postal-code', getPostalCodes)

export default router
