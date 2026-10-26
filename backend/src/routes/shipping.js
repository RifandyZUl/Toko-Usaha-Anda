/**
 * Shipping Routes
 * Endpoints for shipping rates and live courier tariff lookups
 */

import { Router } from 'express'
import { calculateShippingRates } from '../services/shippingService.js'

const router = Router()

/**
 * POST /api/shipping/calculate
 * Calculate dynamic shipping options based on destination and weight
 */
router.post('/calculate', async (req, res, next) => {
  try {
    const { city, province, destinationCityId, weight } = req.body

    const rates = await calculateShippingRates({
      city: typeof city === 'string' ? city : '',
      province: typeof province === 'string' ? province : '',
      destinationCityId: destinationCityId || null,
      weight: Number(weight) || 1000,
    })

    res.status(200).json({
      success: true,
      data: rates,
    })
  } catch (error) {
    next(error)
  }
})

export default router
