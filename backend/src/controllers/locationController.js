/**
 * Location Controller
 * Handles geographic and postal code resolution endpoints
 */

import { searchPostalCodes } from '../services/postalCodeService.js'

/**
 * GET /api/location/postal-code
 * Resolves postal codes based on kelurahan, subdistrict, city, or query string
 */
export async function getPostalCodes(req, res, next) {
  try {
    const { kelurahan, subdistrict, city, province, q } = req.query

    // Validate that at least one location parameter is provided
    if (!kelurahan && !subdistrict && !city && !q) {
      return res.status(200).json({
        success: true,
        data: [],
      })
    }

    const data = await searchPostalCodes({
      kelurahan: typeof kelurahan === 'string' ? kelurahan.slice(0, 100) : '',
      subdistrict: typeof subdistrict === 'string' ? subdistrict.slice(0, 100) : '',
      city: typeof city === 'string' ? city.slice(0, 100) : '',
      province: typeof province === 'string' ? province.slice(0, 100) : '',
      q: typeof q === 'string' ? q.slice(0, 100) : '',
    })

    return res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    next(error)
  }
}
