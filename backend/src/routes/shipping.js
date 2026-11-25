/**
 * Shipping Routes
 * Endpoints for exact courier tariff lookups (BinderByte)
 */

import { Router } from 'express'
import { calculateShippingRates, getItemsWeightGrams } from '../services/shippingService.js'
import { validateShippingCalculate } from '../middleware/validate.js'

const router = Router()

/**
 * POST /api/shipping/calculate
 * Body: { villageId: "36.71.11.1005", items: [{ productId, variantId?, quantity }] }
 * Weight is computed on the server from product data (same rule as order creation), so the fee shown
 * at checkout matches the fee charged. Fails (no estimate) when BinderByte cannot price the route.
 */
router.post('/calculate', validateShippingCalculate, async (req, res, next) => {
  try {
    const { villageId, items } = req.body
    const weightGrams = await getItemsWeightGrams(items)
    const rates = await calculateShippingRates({ villageId, weightGrams })

    res.status(200).json({
      success: true,
      data: rates,
    })
  } catch (error) {
    next(error)
  }
})

export default router
